#!/usr/bin/env python3
"""
원본/ 폴더의 모든 파일을 source-docs/ 의 주제별 폴더로 분류 복사.

- 파일명 키워드 기반 분류 (연도 폴더 파일들)
- 폴더 자체가 주제인 경우 1:1 매핑 (textbook 폴더들)
- 중복/충돌 파일 스킵 (Zone.Identifier, _Conflict, 복사본)
"""
import shutil
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "원본"
DST = ROOT / "source-docs"

# ── 새로 만들 주제 폴더들 ──────────────────────────────────
NEW_TOPICS = [
    "fluid-mechanics", "gas-dynamics", "thermodynamics", "heat-transfer",
    "combustion", "numerical-analysis", "cfd", "math-textbook",
    "propulsion", "mechanics", "turbulence",
]

# ── 폴더 → 주제 직접 매핑 ───────────────────────────────────
FOLDER_MAP = {
    "유체역학": "fluid-mechanics",
    "NS Eq 유도": "fluid-mechanics",
    "기체역학": "gas-dynamics",
    "열역학": "thermodynamics",
    "열전달": "heat-transfer",
    "연소공학": "combustion",
    "수치해석": "numerical-analysis",
    "Numerical Fluid Dynamics - University of Heidelberg - 2008": "numerical-analysis",
    "전산유체역학": "cfd",
    "전산난류유동 강의 - 성홍계": "turbulence",
    "공업수학": "math-textbook",
    "KAU_2019년_2학기_응용수학특론": "math-textbook",
    "유한요소법": "FEM",
    "재료역학": "mechanics",
    "정역학": "mechanics",
    "로켓공학": "propulsion",
    "항공기 추진기관1": "propulsion",
}

# ── 키워드 기반 분류 (연도 폴더 + 최상위 파일) ──────────────
# 우선순위 순서: 위에서 매칭 우선
KEYWORD_RULES = [
    # multiphase: 다상유동, atomization, phase-change, level set, VOF
    (r"기화|충돌\s*모델|분열|레벨셋|CLSVOF|VOF|표면추적|액주|침투궤적|"
     r"Phase\s*change|cavitation|interFoam|Surface\s*tension|Curvature|"
     r"mixture\s*fraction|droplet|spray|sauter|SMD|"
     r"다상|Multi\s*Fluid|conservative.*CLSVOF|"
     r"5\s*equation|6\s*equation|Anti-Diffusion|THINC", "multiphase"),

    # combustion / flame
    (r"Flame|flame|연소|Combustion|combustion|fuel|연료|propulsion|"
     r"메커니즘|Agglomeration|Al\s*nano|paper\s*review|석사|FlameMaster|"
     r"Flamelet|반응|chemistry|chemkin|LES.*premixed|RANS.*premixed|"
     r"non-premixed|premixed|DNS.*flame", "combustion"),

    # numerical-analysis: solver, multigrid, GMRES, AMG, residual smoothing
    (r"Multigrid|multigrid|GMRES|AMG|residual\s*smoothing|"
     r"Linear\s*Solver|Acceleration\s*techniques|Positivity\s*preserving|"
     r"Low\s*mach|Riemann\s*solver\s*개발|Jacobian\s*splitting|"
     r"Bell-Collela|Eigenvalues", "numerical-analysis"),

    # high-order: Riemann, HLLC, Roe, AUSM, Limiter, Recon
    (r"HLLC|Roe|AUSM|Ghost\s*fluid|Limiter|Recon|preconditioned|"
     r"Compact\s*Least|Riemann|Switched-evolution", "high-order"),

    # implicit-solver
    (r"Implicit|implicit|Preconditionor|Preconditioner|RK-implicit|"
     r"Implcit|preconditioning|Flux\s*Jacobian", "implicit-solver"),

    # thermodynamics (EOS files)
    (r"EOS|NASG|GERG|RK-PR|Thermodynamic\s*relationships|"
     r"Cycle|cycle|연소실", "thermodynamics"),

    # code: Fortran, MPI, language, makefile
    (r"포트란|fortran|FORTRAN|C언어|openmp|MPI|CUDA|makefile|"
     r"코드\s*구조|언어|대용량\s*데이터|시스템", "code"),

    # cfd: pressure-based, FVM, FSI, AMR, OpenFoam, rotating
    (r"FVM|pressure\s*based|FSI|fluid\s*structure|Rotating|"
     r"AMR|OpenFoam|기울기\s*재구성|시간전진|Unst3D|문헌\s*조사|"
     r"Boundary\s*[Cc]ondition|Diffusive\s*flux", "cfd"),

    # mesh / numerical (geometry-related)
    (r"Wall\s*distance|wall\s*distance|Least-Square-Method|Least-Square\b", "mesh"),

    # math (general math derivations)
    (r"공업수학|응용수학|미적|선형대수|해석학|"
     r"ApplMath|Eigenvalue|Eigenvector", "math-textbook"),

    # propulsion
    (r"항공|로켓|로케트|propulsion|추진|Rocket|nozzle|noozle|"
     r"thermo.*chamber|왕복기관|흡기|배기|점화|시동", "propulsion"),

    # turbulence (lecture-level, not code)
    (r"turbulent|turbulence|난류|RANS|LES|DNS", "turbulence"),

    # gas-dynamics
    (r"GasDynamics|기체역학|Aerodynamics|GasTurbine|압축성\s*유동", "gas-dynamics"),

    # heat-transfer
    (r"열전달|Heat\s*Transfer|conduction|convection|radiation", "heat-transfer"),

    # fluid-mechanics fallback
    (r"유체역학|fluid\s*mech|Strouhal|항력계수|와동|점성", "fluid-mechanics"),
]

# ── 스킵 패턴 ──────────────────────────────────────────────
SKIP_PATTERNS = [
    r"Zone\.Identifier$",
    r"_Conflict\.",
    r"UserGuide_15\.06 - 복사본\.pdf$",  # 동일 파일 중복
    r"로켓공학 - 구자예\.zip$",  # 압축본 (extracted 폴더 이미 존재)
    r"열역학_KAIST\.zip$",
    r"Heat Transfer - 장석필\.zip$",
    r"\.zip$",  # 모든 zip 스킵 (extract 안됨)
]


def should_skip(path: Path) -> bool:
    name = path.name
    for pat in SKIP_PATTERNS:
        if re.search(pat, name):
            return True
    return False


def classify_file(path: Path) -> str:
    """파일 경로/이름 기반으로 source-docs 하위 폴더명 반환"""
    rel = path.relative_to(SRC)
    parts = rel.parts

    # 1) 톱-레벨 주제 폴더라면 폴더 매핑 사용
    if len(parts) > 1 and parts[0] in FOLDER_MAP:
        return FOLDER_MAP[parts[0]]

    # 2) 키워드 매칭
    full_name = " ".join(parts)
    for pattern, topic in KEYWORD_RULES:
        if re.search(pattern, full_name, re.IGNORECASE):
            return topic

    # 3) 매칭 안되면 misc
    return "misc"


def main():
    if not SRC.exists():
        print(f"❌ 원본 폴더 없음: {SRC}")
        return

    # 새 주제 폴더 생성
    for topic in NEW_TOPICS + ["misc"]:
        (DST / topic).mkdir(parents=True, exist_ok=True)

    stats = {}
    skipped = []
    misc_files = []

    for path in sorted(SRC.rglob("*")):
        if not path.is_file():
            continue
        if should_skip(path):
            skipped.append(path.name)
            continue

        topic = classify_file(path)
        target = DST / topic / path.name

        # 중복 파일명 방지
        if target.exists():
            stem, suf = path.stem, path.suffix
            for i in range(2, 100):
                alt = DST / topic / f"{stem}_{i}{suf}"
                if not alt.exists():
                    target = alt
                    break

        try:
            shutil.copy2(path, target)
            stats[topic] = stats.get(topic, 0) + 1
            if topic == "misc":
                misc_files.append(str(path.relative_to(SRC)))
        except Exception as e:
            print(f"❌ {path.name}: {e}")

    print("\n📊 분류 결과:")
    for topic, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"  {topic}: {count}개")
    print(f"\n⏭️  스킵: {len(skipped)}개")
    for s in skipped[:5]:
        print(f"   - {s}")
    if len(skipped) > 5:
        print(f"   ... 외 {len(skipped)-5}개")

    if misc_files:
        print(f"\n❓ misc로 분류된 파일 ({len(misc_files)}개):")
        for m in misc_files:
            print(f"   - {m}")


if __name__ == "__main__":
    main()
