# 유한체적법(FVM) 기초

## 개요
유한체적법(Finite Volume Method)은 편미분방정식을 컨트롤 볼륨(Control Volume) 단위로 적분하여 이산화하는 수치해석 기법이다.
CFD에서 가장 널리 사용되며, OpenFOAM, Fluent 등 주요 솔버가 이 방식을 채택한다.

## 보존 방정식의 적분 형태

질량 보존 방정식(연속 방정식):
$$\frac{\partial}{\partial t}\int_V \rho \, dV + \oint_S \rho \mathbf{u} \cdot d\mathbf{S} = 0$$

운동량 보존 방정식:
$$\frac{\partial}{\partial t}\int_V \rho \mathbf{u} \, dV + \oint_S \rho \mathbf{u} \mathbf{u} \cdot d\mathbf{S} = -\oint_S p \, d\mathbf{S} + \oint_S \tau \cdot d\mathbf{S}$$

## 이산화 과정

1. 계산 도메인을 유한 개의 컨트롤 볼륨(셀)으로 분할
2. 각 셀에 대해 보존 방정식을 적분
3. 면 플럭스를 셀 중심값으로 보간 (중앙차분, 업윈드 등)
4. 시간 적분 (명시적: 오일러, 암시적: CN)

## 차분 스킴

- **중앙차분(Central Differencing)**: 정확도 2차, 비경계적으로 불안정할 수 있음
- **업윈드(Upwind)**: 정확도 1차, 강건하나 수치 확산 있음
- **QUICK**: 정확도 3차, 구조 격자에 적합

## 예시: 1D 대류-확산 방정식

$$\frac{d}{dx}(\rho u \phi) = \frac{d}{dx}\left(\Gamma \frac{d\phi}{dx}\right)$$

이산화:
$$(\dot{m}_e \phi_e - \dot{m}_w \phi_w) = \frac{\Gamma_e A_e (\phi_E - \phi_P)}{\delta x_e} - \frac{\Gamma_w A_w (\phi_P - \phi_W)}{\delta x_w}$$
