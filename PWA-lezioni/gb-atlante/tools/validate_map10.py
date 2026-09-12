#!/usr/bin/env python3
"""GB-Atlante MAP_10 validator.

Recomputes every check from the current JSON dataset. It never trusts an
existing validation-report.json. Supports destructive mutation tests in
temporary copies to prove that the validator can fail.
"""
from __future__ import annotations

import argparse
import copy
import json
import re
import shutil
import tempfile
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Iterable

from jsonschema import Draft202012Validator, FormatChecker

SNAPSHOT_ID = "MAP_10"
SNAPSHOT_DATE = "1812-06-01"
EXPECTED_SCHEMA_VERSION = "GBATLANTE_MAP10_1.0.1"

PAIRINGS = [
    ("snapshot.json", "snapshot.schema.json"),
    ("entities.json", "entity.schema.json"),
    ("persons.json", "person.schema.json"),
    ("relations.json", "relation.schema.json"),
    ("spatial_assertions.json", "spatial_assertion.schema.json"),
    ("sources.json", "source.schema.json"),
    ("issues.json", "issue.schema.json"),
]

COLLECTION_KEYS = {
    "entities.json": "entities",
    "persons.json": "persons",
    "relations.json": "relations",
    "spatial_assertions.json": "spatial_assertions",
    "sources.json": "sources",
    "issues.json": "issues",
}

ISO_PARTIAL = re.compile(r"^\d{4}(?:-\d{2}(?:-\d{2})?)?$")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def date_bounds(value: str | None) -> tuple[date, date] | None:
    if value is None:
        return None
    if not isinstance(value, str) or not ISO_PARTIAL.match(value):
        raise ValueError(f"invalid ISO partial date: {value!r}")
    p = value.split("-")
    y = int(p[0])
    if len(p) == 1:
        return date(y, 1, 1), date(y, 12, 31)
    m = int(p[1])
    if not 1 <= m <= 12:
        raise ValueError(f"invalid month: {value!r}")
    if len(p) == 2:
        if m == 12:
            nxt = date(y + 1, 1, 1)
        else:
            nxt = date(y, m + 1, 1)
        return date(y, m, 1), date.fromordinal(nxt.toordinal() - 1)
    d = int(p[2])
    dt = date(y, m, d)
    return dt, dt


def active_at_snapshot(valid_from: str | None, valid_to: str | None) -> bool:
    snap = date.fromisoformat(SNAPSHOT_DATE)
    fb = date_bounds(valid_from)
    tb = date_bounds(valid_to)
    if fb and fb[0] > snap:
        return False
    if tb and tb[1] < snap:
        return False
    return True


def source_link_ids(record: dict[str, Any]) -> list[str]:
    return [x.get("source_id", "") for x in record.get("sources", []) if isinstance(x, dict)]


def get_project(root: Path) -> tuple[Path, Path]:
    d = root / "data" / "MAP_10"
    s = d / "schemas"
    return d, s


def validate_project(root: Path, run_mutations: bool = False) -> dict[str, Any]:
    d, schemas = get_project(root)
    loaded = {name: load_json(d / name) for name, _ in PAIRINGS}
    vocab_doc = load_json(d / "vocabularies.json")

    snapshot = loaded["snapshot.json"]
    entities = loaded["entities.json"]["entities"]
    persons = loaded["persons.json"]["persons"]
    relations = loaded["relations.json"]["relations"]
    spatial = loaded["spatial_assertions.json"]["spatial_assertions"]
    sources = loaded["sources.json"]["sources"]
    issues = loaded["issues.json"]["issues"]

    # ---------- JSON Schema ----------
    schema_errors: list[dict[str, Any]] = []
    for data_name, schema_name in PAIRINGS:
        schema = load_json(schemas / schema_name)
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        for err in sorted(validator.iter_errors(loaded[data_name]), key=lambda e: list(e.absolute_path)):
            schema_errors.append({
                "file": data_name,
                "path": list(err.absolute_path),
                "message": err.message,
            })

    # vocabularies itself is not covered by a dedicated schema in Phase 5,
    # therefore verify its required shape and version explicitly.
    vocab_errors: list[str] = []
    if vocab_doc.get("schema_version") != EXPECTED_SCHEMA_VERSION:
        vocab_errors.append(f"vocabularies.schema_version={vocab_doc.get('schema_version')!r}")
    if vocab_doc.get("snapshot_id") != SNAPSHOT_ID:
        vocab_errors.append("vocabularies.snapshot_id mismatch")
    if not isinstance(vocab_doc.get("vocabularies"), dict):
        vocab_errors.append("vocabularies.vocabularies must be object")

    vocabs = {
        k: {item.get("id") for item in vals}
        for k, vals in vocab_doc.get("vocabularies", {}).items()
        if isinstance(vals, list)
    }
    for k, vals in vocab_doc.get("vocabularies", {}).items():
        if not isinstance(vals, list):
            continue
        ids = []
        for idx, v in enumerate(vals):
            if not isinstance(v, dict):
                vocab_errors.append(f"{k}[{idx}] is not object")
                continue
            for req in ("id", "label_it", "definition"):
                if not isinstance(v.get(req), str) or not v.get(req):
                    vocab_errors.append(f"{k}[{idx}].{req} missing/empty")
            ids.append(v.get("id"))
        dup = [x for x, c in Counter(ids).items() if x and c > 1]
        if dup:
            vocab_errors.append(f"{k}: duplicate vocabulary IDs {dup}")

    # Direct controlled-value checks independent of generated JSON Schemas.
    def check_vocab(value: Any, vocab: str, context: str) -> None:
        if value not in vocabs.get(vocab, set()):
            vocab_errors.append(f"{context}: {value!r} not in vocabulary {vocab}")

    for e in entities:
        check_vocab(e.get("entity_class"), "entity_class", f"{e.get('id')}.entity_class")
        check_vocab(e.get("constitutional_form"), "constitutional_form", f"{e.get('id')}.constitutional_form")
        check_vocab(e.get("record_nature"), "record_nature", f"{e.get('id')}.record_nature")
        check_vocab(e.get("display_level"), "display_level", f"{e.get('id')}.display_level")
        check_vocab(e.get("spatial_mode"), "spatial_mode", f"{e.get('id')}.spatial_mode")
        check_vocab(e.get("validity", {}).get("date_precision"), "date_precision", f"{e.get('id')}.validity.date_precision")
        check_vocab(e.get("sovereignty", {}).get("status"), "sovereignty_status", f"{e.get('id')}.sovereignty.status")
        check_vocab(e.get("effective_control", {}).get("status"), "effective_control_status", f"{e.get('id')}.effective_control.status")
        nr = e.get("napoleonic_relation", {})
        for im in nr.get("integration_modes", []):
            check_vocab(im, "integration_mode", f"{e.get('id')}.integration_mode")
        check_vocab(nr.get("alignment"), "alignment", f"{e.get('id')}.alignment")
        check_vocab(nr.get("dependence_level"), "dependence_level", f"{e.get('id')}.dependence_level")
        check_vocab(nr.get("coercion_level"), "coercion_level", f"{e.get('id')}.coercion_level")
        check_vocab(nr.get("war_status"), "war_status", f"{e.get('id')}.war_status")
        check_vocab(e.get("certainty", {}).get("overall"), "certainty", f"{e.get('id')}.certainty.overall")
        for cap in e.get("capital", []):
            check_vocab(cap.get("role"), "capital_role", f"{e.get('id')}.capital.role")
        for oh in e.get("office_holders", []):
            check_vocab(oh.get("role"), "office_role", f"{e.get('id')}.office_holders.role")
    for r in relations:
        check_vocab(r.get("type"), "relation_type", f"{r.get('id')}.type")
        check_vocab(r.get("date_precision"), "date_precision", f"{r.get('id')}.date_precision")
        check_vocab(r.get("certainty"), "certainty", f"{r.get('id')}.certainty")
    for a in spatial:
        check_vocab(a.get("layer_type"), "spatial_layer_type", f"{a.get('id')}.layer_type")
        check_vocab(a.get("status"), "spatial_assertion_status", f"{a.get('id')}.status")
        check_vocab(a.get("certainty"), "certainty", f"{a.get('id')}.certainty")
    for srec in sources:
        check_vocab(srec.get("source_type"), "source_type", f"{srec.get('source_id')}.source_type")
        check_vocab(srec.get("reliability"), "source_reliability", f"{srec.get('source_id')}.reliability")
    for i in issues:
        check_vocab(i.get("issue_type"), "issue_type", f"{i.get('id')}.issue_type")
        check_vocab(i.get("resolution_status"), "resolution_status", f"{i.get('id')}.resolution_status")
        check_vocab(i.get("certainty"), "certainty", f"{i.get('id')}.certainty")

    # ---------- ID uniqueness / emptiness ----------
    id_groups: dict[str, list[str]] = {
        "entity": [e.get("id") for e in entities],
        "person": [p.get("id") for p in persons],
        "relation": [r.get("id") for r in relations],
        "spatial_assertion": [a.get("id") for a in spatial],
        "source": [s.get("source_id") for s in sources],
        "issue": [i.get("id") for i in issues],
    }
    duplicate_ids: list[str] = []
    empty_ids: list[str] = []
    for group, vals in id_groups.items():
        for v in vals:
            if not isinstance(v, str) or not v.strip():
                empty_ids.append(f"{group}: empty ID")
        for v, c in Counter(vals).items():
            if v and c > 1:
                duplicate_ids.append(f"{group}:{v} appears {c} times")

    # ---------- Referential integrity ----------
    entity_ids = {e["id"] for e in entities if e.get("id")}
    person_ids = {p["id"] for p in persons if p.get("id")}
    relation_ids = {r["id"] for r in relations if r.get("id")}
    spatial_ids = {a["id"] for a in spatial if a.get("id")}
    source_ids = {s["source_id"] for s in sources if s.get("source_id")}
    issue_ids = {i["id"] for i in issues if i.get("id")}
    missing: list[str] = []

    def need(value: str | None, valid: set[str], context: str) -> None:
        if value and value not in valid:
            missing.append(f"{context}: missing {value}")

    def need_many(values: Iterable[str], valid: set[str], context: str) -> None:
        for v in values or []:
            need(v, valid, context)

    # snapshot sources
    need_many(snapshot.get("general_cartographic_source_ids", []), source_ids, "snapshot.general_cartographic_source_ids")

    for e in entities:
        eid = e["id"]
        need_many(e.get("sovereignty", {}).get("holder_ids", []), entity_ids, f"{eid}.sovereignty.holder_ids")
        need_many(e.get("sovereignty", {}).get("suzerain_ids", []), entity_ids, f"{eid}.sovereignty.suzerain_ids")
        need_many(e.get("sovereignty", {}).get("competing_claimant_ids", []), entity_ids, f"{eid}.sovereignty.competing_claimant_ids")
        need_many(e.get("sovereignty", {}).get("holder_person_ids", []), person_ids, f"{eid}.sovereignty.holder_person_ids")
        need_many(e.get("sovereignty", {}).get("basis_relation_ids", []), relation_ids, f"{eid}.sovereignty.basis_relation_ids")
        need_many(e.get("effective_control", {}).get("primary_controller_ids", []), entity_ids, f"{eid}.effective_control.primary_controller_ids")
        need_many(e.get("effective_control", {}).get("competing_controller_ids", []), entity_ids, f"{eid}.effective_control.competing_controller_ids")
        need_many(e.get("effective_control", {}).get("spatial_assertion_ids", []), spatial_ids, f"{eid}.effective_control.spatial_assertion_ids")
        need_many(e.get("institutional_memberships", []), relation_ids, f"{eid}.institutional_memberships")
        need_many(e.get("relations", []), relation_ids, f"{eid}.relations")
        need_many(e.get("territorial_components", []), entity_ids, f"{eid}.territorial_components")
        need_many(e.get("issue_ids", []), issue_ids, f"{eid}.issue_ids")
        for h in e.get("office_holders", []):
            need(h.get("person_id"), person_ids, f"{eid}.office_holders")
        for sl in e.get("sources", []):
            need(sl.get("source_id"), source_ids, f"{eid}.sources")
    for p in persons:
        for sl in p.get("sources", []):
            need(sl.get("source_id"), source_ids, f"{p['id']}.sources")
    for r in relations:
        need(r.get("subject_id"), entity_ids, f"{r['id']}.subject_id")
        need(r.get("object_id"), entity_ids, f"{r['id']}.object_id")
        need_many(r.get("issue_ids", []), issue_ids, f"{r['id']}.issue_ids")
        for sl in r.get("sources", []):
            need(sl.get("source_id"), source_ids, f"{r['id']}.sources")
        q = r.get("qualifiers", {})
        if isinstance(q, dict):
            if "ruler_person_id" in q:
                need(q["ruler_person_id"], person_ids, f"{r['id']}.qualifiers.ruler_person_id")
            need_many(q.get("person_ids", []), person_ids, f"{r['id']}.qualifiers.person_ids")
    for a in spatial:
        need(a.get("subject_entity_id"), entity_ids, f"{a['id']}.subject_entity_id")
        need(a.get("actor_entity_id"), entity_ids, f"{a['id']}.actor_entity_id")
        need_many(a.get("issue_ids", []), issue_ids, f"{a['id']}.issue_ids")
        for sl in a.get("sources", []):
            need(sl.get("source_id"), source_ids, f"{a['id']}.sources")
    for i in issues:
        need_many(i.get("affected_entities", []), entity_ids, f"{i['id']}.affected_entities")
        for sl in i.get("sources", []):
            need(sl.get("source_id"), source_ids, f"{i['id']}.sources")

    # Every entity must have evidence or an explicit issue.
    evidence_errors: list[str] = []
    for e in entities:
        if not e.get("sources") and not e.get("issue_ids"):
            evidence_errors.append(f"{e['id']}: neither source nor issue")

    # ---------- Date / snapshot consistency ----------
    date_errors: list[str] = []

    def inspect_dates(rid: str, vf: str | None, vt: str | None, *, must_be_active: bool = True) -> None:
        try:
            fb = date_bounds(vf)
            tb = date_bounds(vt)
        except Exception as exc:
            date_errors.append(f"{rid}: {exc}")
            return
        if fb and tb and fb[0] > tb[1]:
            date_errors.append(f"{rid}: valid_from {vf} after valid_to {vt}")
        if must_be_active and not active_at_snapshot(vf, vt):
            date_errors.append(f"{rid}: record is not active at snapshot {SNAPSHOT_DATE} ({vf}..{vt})")

    if snapshot.get("date") != SNAPSHOT_DATE:
        date_errors.append(f"snapshot.date={snapshot.get('date')!r}, expected {SNAPSHOT_DATE}")
    for e in entities:
        inspect_dates(e["id"], e["validity"].get("from"), e["validity"].get("to"), must_be_active=True)
        if e.get("as_of") != SNAPSHOT_DATE:
            date_errors.append(f"{e['id']}: as_of != {SNAPSHOT_DATE}")
    for r in relations:
        inspect_dates(r["id"], r.get("valid_from"), r.get("valid_to"), must_be_active=True)
    for a in spatial:
        inspect_dates(a["id"], a.get("valid_from"), a.get("valid_to"), must_be_active=True)

    # ---------- Relation semantics ----------
    relation_errors: list[str] = []
    for r in relations:
        if r.get("subject_id") == r.get("object_id"):
            relation_errors.append(f"{r['id']}: accidental self-reference")
    # Semantics are tested by ensuring no inference artifacts were materialized.
    relset = {(r["subject_id"], r["type"], r["object_id"]): r for r in relations}

    # ---------- Spatial assertions ----------
    geometry_non_null = [a["id"] for a in spatial if a.get("geometry_id") is not None]

    # ---------- Source quality policy ----------
    source_by_id = {s["source_id"]: s for s in sources}
    source_quality_errors: list[str] = []
    source_quality_warnings: list[str] = []

    def adequate_high_support(rec: dict[str, Any], context: str) -> None:
        links = rec.get("sources", [])
        if not links:
            source_quality_errors.append(f"{context}: high certainty without sources")
            return
        evidence = [source_by_id.get(x.get("source_id")) for x in links]
        evidence = [s for s in evidence if s]
        if any(s.get("reliability") in {"primary_direct", "high"} for s in evidence):
            return
        # Two independent medium sources are accepted if institutions differ.
        med_inst = {s.get("author_or_institution") for s in evidence if s.get("reliability") == "medium"}
        if len(med_inst) >= 2:
            source_quality_warnings.append(f"{context}: high certainty rests on two medium independent sources")
            return
        source_quality_errors.append(f"{context}: high certainty supported only by weak/insufficient sources")

    for e in entities:
        if e.get("certainty", {}).get("overall") == "high":
            adequate_high_support(e, f"entity {e['id']}")
    for r in relations:
        if r.get("certainty") == "high":
            adequate_high_support(r, f"relation {r['id']}")
    for a in spatial:
        if a.get("certainty") == "high":
            adequate_high_support(a, f"spatial {a['id']}")
    for i in issues:
        if i.get("certainty") == "high":
            adequate_high_support(i, f"issue {i['id']}")

    upgrade_sources = [s["source_id"] for s in sources if s.get("needs_source_upgrade")]
    for sid in upgrade_sources:
        source_quality_warnings.append(f"{sid}: needs_source_upgrade=true")

    # ---------- Historical tests calculated from data ----------
    entity_by_id = {e["id"]: e for e in entities}

    def t(tid: str, cond: bool, detail: str) -> dict[str, Any]:
        return {"id": tid, "passed": bool(cond), "detail": detail}

    _missing_entity = {
        "sovereignty": {"holder_ids": []},
        "effective_control": {"status": None, "primary_controller_ids": []},
        "napoleonic_relation": {"integration_modes": [], "war_status": None},
        "territorial_components": [],
        "entity_class": None,
        "record_nature": None,
    }
    E = defaultdict(lambda: _missing_entity, entity_by_id)
    tests: list[dict[str, Any]] = []
    tests.append(t("HT01_BAVARIA_NOT_FRANCE", "FRA_EMPIRE" not in E["BAV_KINGDOM"]["sovereignty"]["holder_ids"], "BAV_KINGDOM sovereignty holder is not FRA_EMPIRE"))
    tests.append(t("HT02_BAVARIA_MEMBER_RHINE", ("BAV_KINGDOM", "member_of", "CONF_RHINE") in relset, "BAV_KINGDOM member_of CONF_RHINE"))
    tests.append(t("HT03_RHINE_NOT_OWNER_BAVARIA", ("BAV_KINGDOM", "territorial_component_of", "CONF_RHINE") not in relset and "BAV_KINGDOM" not in E["CONF_RHINE"]["territorial_components"], "CONF_RHINE does not own Bavaria"))
    tests.append(t("HT04_CATALONIA_NOT_FRANCE_COMPONENT", ("CAT_SPECIAL", "territorial_component_of", "FRA_EMPIRE") not in relset, "CAT_SPECIAL is not territorial_component_of FRA_EMPIRE"))
    tests.append(t("HT05_CATALONIA_ADMIN_FRANCE", ("CAT_SPECIAL", "administered_by", "FRA_EMPIRE") in relset, "CAT_SPECIAL administered_by FRA_EMPIRE"))
    tests.append(t("HT06_AUSTRIA_FR_ALLY", ("FRA_EMPIRE", "military_alliance_with", "AUT_EMPIRE") in relset or ("AUT_EMPIRE", "military_alliance_with", "FRA_EMPIRE") in relset, "Austria has treaty/military alliance relation with France"))
    tests.append(t("HT07_PRUSSIA_FR_ALLY", ("FRA_EMPIRE", "military_alliance_with", "PRU_KINGDOM") in relset or ("PRU_KINGDOM", "military_alliance_with", "FRA_EMPIRE") in relset, "Prussia has coerced treaty/military alliance relation with France"))
    tests.append(t("HT08_AUSTRIA_NOT_DYNASTIC_CLIENT", "dynastic_client" not in E["AUT_EMPIRE"]["napoleonic_relation"]["integration_modes"], "AUT_EMPIRE is not dynastic_client"))
    tests.append(t("HT09_PRUSSIA_NOT_DYNASTIC_CLIENT", "dynastic_client" not in E["PRU_KINGDOM"]["napoleonic_relation"]["integration_modes"], "PRU_KINGDOM is not dynastic_client"))
    tests.append(t("HT10_RUSSIA_PREWAR", E["RUS_EMPIRE"]["napoleonic_relation"]["war_status"] == "prewar_adversary", "RUS_EMPIRE war_status = prewar_adversary"))
    tests.append(t("HT11_FR_RUS_NOT_AT_WAR", ("FRA_EMPIRE", "at_war_with", "RUS_EMPIRE") not in relset and ("RUS_EMPIRE", "at_war_with", "FRA_EMPIRE") not in relset, "France and Russia are not yet at_war_with on 1812-06-01"))
    tests.append(t("HT12_JOSEPH_NOT_FULL_CONTROL", E["ESP_JOSEPH"]["effective_control"]["status"] != "full", "ESP_JOSEPH effective_control != full"))
    tests.append(t("HT13_WARSAW_NOT_FRANCE", ("WARSAW_GD", "territorial_component_of", "FRA_EMPIRE") not in relset, "WARSAW_GD is not territorial_component_of FRA_EMPIRE"))
    tests.append(t("HT14_ILLYRIA_FRENCH_SOV", "FRA_EMPIRE" in E["FRA_ILLYRIA"]["sovereignty"]["holder_ids"] and ("FRA_ILLYRIA", "territorial_component_of", "FRA_EMPIRE") in relset, "FRA_ILLYRIA belongs to French sovereignty"))
    tests.append(t("HT15_ILLYRIA_NOT_NORMAL_DEPARTMENT", E["FRA_ILLYRIA"]["entity_class"] != "administrative_unit" and E["FRA_ILLYRIA"]["record_nature"] == "historical_analytical_aggregation", "FRA_ILLYRIA is not a normal French departmental administrative unit"))
    tests.append(t("HT16_MALTA_CONTROL_UK", "UK" in E["MALTA"]["effective_control"]["primary_controller_ids"], "MALTA primary_controller = UK"))
    tests.append(t("HT17_MALTA_SOV_NOT_UK", not (E["MALTA"]["sovereignty"]["status"] == "full" and E["MALTA"]["sovereignty"]["holder_ids"] == ["UK"]), "MALTA sovereignty not automatically UK"))
    tests.append(t("HT18_POMERANIA_OCC_FR", ("SWEDISH_POMERANIA", "occupied_by", "FRA_EMPIRE") in relset, "SWEDISH_POMERANIA occupied_by FRA_EMPIRE"))
    tests.append(t("HT19_POMERANIA_SOV_SWE", "SWE_KINGDOM" in E["SWEDISH_POMERANIA"]["sovereignty"]["holder_ids"], "SWEDISH_POMERANIA sovereignty remains Swedish"))
    rhine_members = [r for r in relations if r["type"] == "member_of" and r["object_id"] == "CONF_RHINE" and active_at_snapshot(r.get("valid_from"), r.get("valid_to"))]
    tests.append(t("HT20_RHINE_MEMBER_COUNT", len(rhine_members) == 35, f"CONF_RHINE has {len(rhine_members)} active members; adopted number is 35"))
    tests.append(t("HT21_WALDECK_MEMBER_RHINE", ("WALDECK", "member_of", "CONF_RHINE") in relset, "WALDECK is a Rheinbund member"))
    tests.append(t("HT22_PYRMONT_MEMBER_RHINE", ("PYRMONT", "member_of", "CONF_RHINE") in relset, "PYRMONT is independently represented as a Rheinbund member"))
    tests.append(t("HT23_WALDECK_PYRMONT_DISTINCT", "WALDECK" in E and "PYRMONT" in E and E["WALDECK"]["id"] != E["PYRMONT"]["id"], "Waldeck and Pyrmont remain distinct political records at snapshot"))
    tests.append(t("HT24_WALDECK_PYRMONT_NO_PERSONAL_UNION_YET", ("WALDECK", "personal_union_with", "PYRMONT") not in relset and ("PYRMONT", "personal_union_with", "WALDECK") not in relset, "No Waldeck-Pyrmont personal union is active on 1812-06-01"))

    # Relation semantic invariants beyond named historical tests.
    # member_of/administered_by/occupied_by never create ownership automatically.
    for r in relations:
        if r["type"] == "member_of" and (r["subject_id"], "territorial_component_of", r["object_id"]) in relset:
            # It can be legitimate in another dataset, but in this model a duplicate must be explicit and documented.
            relation_errors.append(f"{r['id']}: member_of coexists with territorial_component_of; review sovereignty inference")

    # ---------- Aggregate result ----------
    historical_failed = [x for x in tests if not x["passed"]]
    hard_errors = (
        len(schema_errors) + len(vocab_errors) + len(duplicate_ids) + len(empty_ids)
        + len(missing) + len(evidence_errors) + len(date_errors) + len(relation_errors)
        + len(geometry_non_null) + len(source_quality_errors) + len(historical_failed)
    )

    issue_status_counts = Counter(i.get("resolution_status") for i in issues)
    report: dict[str, Any] = {
        "schema_version": EXPECTED_SCHEMA_VERSION,
        "snapshot_id": SNAPSHOT_ID,
        "validated_at": "2026-09-12",
        "validator_mode": "recomputed_from_current_dataset",
        "summary": {
            "entities": len(entities),
            "persons": len(persons),
            "relations": len(relations),
            "spatial_assertions": len(spatial),
            "sources": len(sources),
            "issues": len(issues),
            "rheinbund_members": len(rhine_members),
        },
        "schema_validation": {"draft": "2020-12", "errors": schema_errors, "passed": not schema_errors},
        "id_validation": {"duplicate_ids": duplicate_ids, "empty_ids": empty_ids, "passed": not duplicate_ids and not empty_ids},
        "referential_integrity": {"missing_references": missing, "evidence_errors": evidence_errors, "passed": not missing and not evidence_errors},
        "date_validation": {"errors": date_errors, "snapshot_date": SNAPSHOT_DATE, "passed": not date_errors},
        "vocabulary_validation": {"errors": vocab_errors, "passed": not vocab_errors},
        "relation_validation": {"errors": relation_errors, "passed": not relation_errors},
        "geometry_check": {"geometry_ids_non_null": len(geometry_non_null), "ids": geometry_non_null, "passed": not geometry_non_null},
        "source_quality": {
            "policy": "high certainty requires >=1 primary_direct/high reliability source, or >=2 independent medium sources; needs_source_upgrade is always reported",
            "errors": source_quality_errors,
            "warnings": source_quality_warnings,
            "sources_still_needing_upgrade": upgrade_sources,
            "passed": not source_quality_errors,
        },
        "historical_tests": {
            "passed": sum(1 for x in tests if x["passed"]),
            "failed": len(historical_failed),
            "tests": tests,
        },
        "mutation_tests": {"passed": 0, "failed": 0, "tests": [], "executed": False},
        "issues": {
            "open": [i["id"] for i in issues if i.get("resolution_status") == "open"],
            "provisionally_resolved": [i["id"] for i in issues if i.get("resolution_status") == "provisionally_resolved"],
            "resolved": [i["id"] for i in issues if i.get("resolution_status") == "resolved"],
            "blocked": [i["id"] for i in issues if i.get("resolution_status") == "blocked"],
            "counts": dict(issue_status_counts),
        },
        "hard_error_count": hard_errors,
        "valid": hard_errors == 0,
    }

    if run_mutations:
        report["mutation_tests"] = run_mutation_tests(root)
        if report["mutation_tests"]["failed"]:
            report["hard_error_count"] += report["mutation_tests"]["failed"]
            report["valid"] = False

    report["readiness"] = {
        "ready_for_geometry_planning": bool(report["valid"]),
        "ready_for_geometry_digitization": False,
        "reason": (
            "Audit/hardening passed; unresolved historical ambiguities remain explicit and geometry_id is null."
            if report["valid"]
            else "Validation errors remain; do not proceed to geometry planning."
        ),
    }
    return report


def run_mutation_tests(root: Path) -> dict[str, Any]:
    tests: list[dict[str, Any]] = []

    def one(test_id: str, mutate) -> None:
        with tempfile.TemporaryDirectory(prefix="gbatlante_mut_") as td:
            clone_root = Path(td) / "GB-Atlante"
            shutil.copytree(root / "data", clone_root / "data")
            (clone_root / "tools").mkdir(parents=True, exist_ok=True)
            mutate(clone_root / "data" / "MAP_10")
            rep = validate_project(clone_root, run_mutations=False)
            passed = not rep["valid"]
            tests.append({
                "id": test_id,
                "passed": passed,
                "detail": "validator rejected corrupted fixture" if passed else "ERROR: validator accepted corrupted fixture",
                "detected_hard_errors": rep["hard_error_count"],
            })

    def mutate_a(d: Path) -> None:
        p = d / "entities.json"; doc = load_json(p)
        e = next(x for x in doc["entities"] if x["id"] == "BAV_KINGDOM")
        e["sovereignty"]["holder_ids"] = ["FRA_EMPIRE"]
        dump_json(p, doc)

    def mutate_b(d: Path) -> None:
        p = d / "entities.json"; doc = load_json(p)
        doc["entities"] = [x for x in doc["entities"] if x["id"] != "BAV_KINGDOM"]
        dump_json(p, doc)

    def mutate_c(d: Path) -> None:
        p = d / "spatial_assertions.json"; doc = load_json(p)
        doc["spatial_assertions"][0]["geometry_id"] = "TEST_GEOMETRY"
        dump_json(p, doc)

    def mutate_d(d: Path) -> None:
        p = d / "relations.json"; doc = load_json(p)
        doc["relations"][0]["certainty"] = "very_high"
        dump_json(p, doc)

    def mutate_e(d: Path) -> None:
        p = d / "relations.json"; doc = load_json(p)
        r = next(x for x in doc["relations"] if x["id"] == "REL_BAV_KINGDOM_RHINE")
        r["valid_from"] = "1813-01-01"; r["valid_to"] = None; r["date_precision"] = "day"
        dump_json(p, doc)

    one("MUT_A_BAVARIA_SOVEREIGNTY_CORRUPTION", mutate_a)
    one("MUT_B_DELETE_REFERENCED_ENTITY", mutate_b)
    one("MUT_C_NON_NULL_GEOMETRY", mutate_c)
    one("MUT_D_INVALID_CERTAINTY_ENUM", mutate_d)
    one("MUT_E_FUTURE_ACTIVE_RELATION", mutate_e)
    return {
        "executed": True,
        "passed": sum(1 for x in tests if x["passed"]),
        "failed": sum(1 for x in tests if not x["passed"]),
        "tests": tests,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument("--write-report", action="store_true")
    ap.add_argument("--mutation-tests", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()
    root = args.root.resolve()
    report = validate_project(root, run_mutations=args.mutation_tests)
    if args.write_report:
        d, _ = get_project(root)
        dump_json(d / "validation-report.json", report)
    if not args.quiet:
        print(f"MAP_10 validation: {'PASS' if report['valid'] else 'FAIL'}")
        print(f"Entities: {report['summary']['entities']}")
        print(f"Rheinbund members: {report['summary']['rheinbund_members']}")
        print(f"Schema errors: {len(report['schema_validation']['errors'])}")
        print(f"Missing references: {len(report['referential_integrity']['missing_references'])}")
        print(f"Temporal errors: {len(report['date_validation']['errors'])}")
        print(f"Vocabulary errors: {len(report['vocabulary_validation']['errors'])}")
        print(f"Source-quality errors: {len(report['source_quality']['errors'])}")
        print(f"Historical tests: {report['historical_tests']['passed']} passed, {report['historical_tests']['failed']} failed")
        if report['mutation_tests']['executed']:
            print(f"Mutation tests: {report['mutation_tests']['passed']} passed, {report['mutation_tests']['failed']} failed")
        if report['hard_error_count']:
            print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
