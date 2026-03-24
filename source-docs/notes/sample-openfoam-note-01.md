# OpenFOAM simpleFoam 튜토리얼: 후방 계단(Backward Facing Step)

## 개요
simpleFoam은 비압축성 정상 유동 해석을 위한 SIMPLE 알고리즘 기반 솔버다.
이 튜토리얼에서는 후방 계단 형상에서 재부착 유동을 시뮬레이션한다.

## 케이스 구조

```
backwardFacingStep/
├── 0/
│   ├── U          # 속도 초기/경계 조건
│   ├── p          # 압력 초기/경계 조건
│   ├── k          # 난류 운동에너지
│   └── epsilon    # 난류 소산율
├── constant/
│   ├── transportProperties
│   └── turbulenceProperties
└── system/
    ├── blockMeshDict
    ├── fvSchemes
    └── fvSolution
```

## 경계 조건 설정 (0/U)

```cpp
inlet
{
    type        fixedValue;
    value       uniform (1 0 0);  // 입구 속도 1 m/s
}

outlet
{
    type        zeroGradient;
}

wall
{
    type        noSlip;
}
```

## fvSolution 설정

```cpp
SIMPLE
{
    nNonOrthogonalCorrectors 0;
    pRefCell    0;
    pRefValue   0;
    residualControl
    {
        p       1e-4;
        U       1e-4;
        "(k|epsilon)" 1e-4;
    }
}

relaxationFactors
{
    fields  { p 0.3; }
    equations { U 0.7; k 0.7; epsilon 0.7; }
}
```

## 실행 순서

```bash
blockMesh           # 격자 생성
simpleFoam          # 해석 실행
paraFoam            # 결과 시각화
```

## 예상 결과
- 계단 하류에서 재순환 영역(recirculation zone) 형성
- 재부착 길이(reattachment length): 약 6-8H (H: 계단 높이)
- Reynolds 수에 따라 재순환 영역 크기 변화
