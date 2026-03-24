# CFD 실무 Q&A 로그

## [2026-03-24] OpenFOAM 압력-속도 커플링 수렴 실패

**문제**: simpleFoam 실행 시 pressure residual이 1e-3 아래로 떨어지지 않고 발산함.

**환경**: OpenFOAM v2312, 2D 채널 유동, k-ε 난류 모델

**원인 분석**:
- relaxationFactors가 U=0.9, p=0.7로 너무 높게 설정됨
- 초기 조건에서 pressure gradient가 과도하게 설정됨

**해결**:
- relaxationFactors: U=0.7, p=0.3으로 낮춤
- 초기 p 필드를 0으로 초기화 후 재실행

**교훈**: SIMPLE 알고리즘에서 relaxation factor는 수렴 안정성에 직접 영향. 첫 실행은 보수적으로.
