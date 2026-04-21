# [20-02-28] 압축성 pressure based 방정식 정리

> 원본: `cfd/[20-02-28] 압축성 pressure based 방정식 정리.docx`

,
The generic scalar transport equation governing the transport of mass, momentum, energy, and other transported scalas.,  는 transported scalar
1. 낮은 마하수 유동의 해석 방법
낮은 마하수 유동의 해석에는 약간의 어려움이 있다. 이런 어려움을 극복하기 위해 다음과 같은 방법을 쓴다.
1) 유체 속도 v 및 어쿠스틱 속도 c 사이의 이종 스케일(disparate scales)을 활용하라.
2) 변수의 분해 및 전체 지배 방정식을 단순화 하라.
3) M -> 0 일 때 비압축 솔루션으로 축소하라.
1.1. 예조건화 기법 (Preconditioning Schemes)
이 방법의 핵심은 가상적으로(artificially) 음속을 선택하는 것이다. 이 방법은 Chorin의 가상 압축성 방법과 관련되어 있다.
1.1.1 SIMPLE/PISO 방법
이 방법은 가상 압축성 방법과 약간 유사한 개념이다. SIMPLE (Semi-Implicit Method for Pressure Linked Equations) 방법은 1970년에 Spalding & Patankar에 의해 개발되었다. 3가지 특징이 있다. 연속 방정식을 압력 진화(evolution) 방정식으로 대체하고, 압력-속도 시스템에 대한 커플링을 정의, 그리고 커플링 항의 implicit 완화를 사용한다. 비록 이 알고리즘은 steady flow 으로 디자인 되었지만, transient flow로 확장할 수 있다. 하지만 이 방법은 운동량 밸런스를 만족하기 위해 반복 계산을 사용한다. 하지만 적용하기 매우 쉬운 방법이고 오늘날 steady-state 계산에 많이 쓰인다.
1980년대에 Raad Issa는 PISO (Pressure-Implicit with Splitting of Operators) 기법을 개발했다. PISO는 SIMPLE과 유사하고 단지 밀도는 연속방정식과 운동량 밸런스가 적합하게 하는 예측자-수정자 (predictor-corrector) 단계로 업데이트된다. 이 단계는 약간의 반복 (2~3번)으로 가능하고, 해의 오차는 O(dt^2) 으로 스케일된다.
각각에 대한 비압축성 압축성 버전이 있다. SIMPLE은 상용 및 오픈코드에 많이 쓰인다 (Fluent, OpenFoam, Converge 등) 또한 마하수 항에 대한 특별한 고려가 없는 것이 장점이다.
1) SIMPLE
1. p* : 압력 p* 추측
2. U* : 추측된 p*로 운동량 방정식 계산 후 U* 를 얻음 (운동량 predictor step)
3. p** : 압력 방정식 계산과 under-relaxation을 적용 후 압력을 업데이트함 (압력 correction step)
4. U** : velocity-correction 방정식으로 under-relaxation 적용된 face에서의 속도 업데이트
5. 수렴때까지 2~4 step을 반복
이희범, et al. "수정된 오픈폼 기본 해석자를 활용한 FPSO 의 조류 하중 해석." 한국전산유체공학회 학술대회논문집 (2015): 12-13.
1) 운동방정식을 풀어 추정속도 U*를 구한다.
2) 셀 면에서의 질량흐름률은 코로케이트 격자에서의 압력 체커-보드 현상을 피하기 위해 Delayed pressure 차분화 또는 Rhie-Chow 보간법을 사용한다.
or
3) 압력방정식을 풀어 수정된 압력 P*를 구한 후 완화계수를 사용하여 압력을 업데이트한다.
4) 질량 흐름율을 수정한다.
5) 셀 속도를 수정한다.
2) PISO
1. U* : 이전 time-step 해를 사용하고, 운동량 방정식의 계수를 계산하고, implicit 방정식의 이 시스템을 계산하라. (속도 predictor step)
2. p* : 이 예견된 속도를 사용하고, 압력 방정식의 계수를 계산하고, implicit 하게 압력장을 해결하라(압력 predictor step)
3. U** : 운동량 방정식을 사용하여 속도장을 explicit 하게 correct한다 (첫번째 속도 corrector step)
4. p** : 수집된 속도를 사용하여, corrector step에서의 압력 방정식의 계수를 계산하고, 업데이트된 압력장을 얻기위해 방정식의 implicit 시스템을 해결하라.
5. U*** : 수집된 압력장을 사용하고, explicit 운동량 방정식을 사용하여 속도장을 재측정하라. (두번째 속도 corrector step)
6. 다음 time-step으로 도달하라.
3) PIMPLE
이것은 transient 계산에서 큰 time-step 알고리즘이다. 이것은 한 타임스텝 내에서 under-relaxation으로 steady-state 솔루션을 찾는다. 코란트 수에 제한이 없기 때문에 큰 시간전진을 할 수 있다. 그러나 Navier-Stokes 방정식이 implicit 스킴을 쓸지라도 수치적 불안정을 야기할 수 있기 때문에 적절한 시간step을 선택해야한다.
[2] 논문의 PIMPLE 정리
1. 현재 시간을 업데이트 한다,
2. 이전 시간에서의 모든 변수를 저장한다.
3. 연속방정식의 명시적 버전을 사용하여 밀도를 예측한다. (이전 시간에서의 질량 플럭스와 함께)
4. 만약 SIMPLE 루프의 끝이면, (1)로 가고, 아니면 다음 단계로 간다.
5. 운동량 방정식에 대한 행렬을 수집하고 오퍼레이터 H(U) 와 A를 측정한다.
6. 만약 시간 단계 끝에서 에너지를 정확히 보존해야되는 경우, PISO 루프 (8)로 가고, 아니면 다음 단계로 간다.
7. 현재 플럭스 (첫번째 SIMPLE 반복에 대한 이전 시간단계) 를 사용해 에너지 방정식을 해결한다.
8. 만약 PISO 루프 끝이면, 단계 (18)에서 에너지 업데이트 블록으로 가고, 아니면 다음 단계로 간다.
9. 만약 시간 단계에서 에너지를 정확히 보존해야되는 경우, 다음 단계로 가고, 아니면 (11)로 간다.
10. 에너지를 해결하라.
11. 압력을 해결하라.
12. 새로운 압력 구배와 함께 속도장을 업데이트한다.
13. 새로운 질량 플럭스를 가지고 명시적 연속 방정식을 해결한다.
14. 상태 방정식을 가지고 밀도를 업데이트한다.
15. 만약 시간 단계에서 에너지를 정확히 보존해야되는 경우, 다음단계로 가고 아니면 (8)로 간다.
16. 블렌딩 함수 장 K_f 를 업데이트한다.
17. 공학적(mechanical) 에너지와 관계된 플럭스를 업데이트 한다. 그리고 (8)로 진행한다.
18. 만약 시간 단계에서 에너지를 정확히 보존해야되는 경우, (4)로 가고, 아니면 다음 단계로 간다.
19. 블렌딩 함수 장 K_f 를 업데이트한다.
20. 공학적 에너지와 관련된 플럭스를 업데이트하고 (4)로 간다.
[10] 논문의 PIMPLE
[11] 논문에서,
Rhie-Chow 내삽 기법으로 격자면에서의 면속도를 계산하여 푼다.
= Rho based PISO + SIMPLE (PIMPLE)
SIMPLE-like (SIMPLE, SIMPLER, SIMPLEST-ANL, SIMPLEC) : 이 스킴은 unsteady 에서 취약하다 -> 압력 방정식에서  텀 때문이다.
PISO 에서는 위의 밀도 텀은 EOS로부터 유도된 압력으로 치환된다.
PIMPLE 알고리즘
1.1.2 명시적 예조건화 (Explicit Preconditioning)
M -> 0 일 때, 시스템의 stiffeneness 를 감소시키는 방법이다. 그것은 steady-stat flow에 대한 예조건화 행렬의 수를 조절한다. 전형적인 접근은 가상 압축성을 사용하고 최대 아이겐값을 축소시킨 방정식으로 스케일한다. 초기에 예조건화 방법은 steady-state Euler 방정식에 사용되었다.
Weiss & Smith 는 처음으로 명시적 예조건화 방법을 디자인했다. Meister 는 시간-의존 방법의 몇가지를 리뷰했고 취약(weakly) 압축성 레짐(regime)으로 그 방법을 사용했다.  Wesseling은 압축성 솔버를 취약 압축성 유동 레짐에 사용가능성을 보여줬다.
명시적 예조건화 기법과 유사한 몇가지 새로운 분할(splitting) 기법이 있다. Haack 등은 압축성 유동의 모든 속도에서 사용가능한 더 진보된 명시적 방법을 제안했다. “예조건화”는 시간항과 공간항에 각각 적용된다. 그들은 모든 속도에서 조정가능한 매개변수가 있는 분할 방정식을 제안했다. 안정성 분석(stability analysis)는 시간전진이 음속에 독립적이지만, 더 엄격한 제약이 있다는 것을 보여줬다.
1.1.3 다른 예조건화 기법
명시적 예조건화와 닮은 기법들은 널리 사용된다.
하이브리드 명시-암시적 예조건화 기법도 존재한다. 암시적 필요를 제거하기 위해 방정식을 변화하는 대신, 이 방법은 암시(implicitness)를 사용하고 반복을 사용한다. 처음에 명시적 방법을 사용하여 시간전인을 취하고 그 다음 암시적 예조건화 단계를 거친다. 이 단계는 수렴될때까지 암시적 방정식 시스템을 해결한다. 이 방법의 큰 단점은 예조건화 변수 항과 반복 해법이 매우 비싸다는 것이다.
점근적(Asymptotic) 방법은 압축성 방법의 별개의 방법이다. 이 방법은 낮은 M 근사화를 사용하여 유도되지만, 어쿠스틱 효과는 완벽히 필터되지 않는다.
Kwatra는 다른 방법을 제안했다. 압력 방정식에서의 속도 항의 미분항은 속도 방정식 (암시적으로 완화된)으로부터의 압력 구배항으로 근사화된다. 이것은 정확한 타원(elliptic)형태 압력이 마하수 0의 제한에서 해결된다. 이 방법은 보존 방정식 형태로 해결되고, 고 마하수에서도 설득력 있는 결과를 나타냈다. 이 방법의 단점은 압력 상태 방정식을 시행하는 데에 부족한 점이다. 비교적 간단한 예에서, 적은 수의 압력 솔버 반복이 상태 방정식과 매우 유사한 결과를 산출 함을 보여주었다. 압력 해법에 이완을 포함하면 결과가 향상될 수 있다. 이것은 최근에 Navier-Stokes 방정식으로 확장되었다. 낮은 마하수와 장시간의 적분, 그리고 점성항이 포함되면 불안정이 관찰된다. 새로운 연구는 불안정성을 고쳤지만 점성항을 명시적으로 다루었다.
마하-일정(Mach-Uniform) 방법 또는 모든-속도 방법은 전체 마하수에 잘 작동하는 특별한 해법이다. 원래 모든-속도 방법은 ICE (Implicit Continuous-fluid Eulerian)으로 불렸다. 이 방법에 대한 프레임워크는 MAC (Marker-And-Cell) 비압축성 유동 솔버이다. ICE에서, 마하수가 0으로 접근하면 MAC 방법은 사용된다. 마하수가 무한대로 가면, 기존의 압축성 오일러 솔버의 암시적 방법은 사용된다.
1.2. 압력-암시적(Pressure-Implicit) 방법
이 방법에서는 압축성 효과는 암시적으로 완화되고 점근(asymptotics)을 통해 전체적으로 제거된다.
1.2.1. 거의(Barely) 암시적 플럭스-수집-전송 (Flux-Corrected-Transport, FCT)
이 방법은 Patnaik 등에 의해 개발된 명시적 예조건화 기법과 유사하다. 이 아이디어의 시작은 명시적 플럭스-수집-전송 방법에 있고, 낮은 마하수에서 작은 시간 전진 문제를 제거하기 위해 암시적 수집(correction)을 추가한다. 여기서 시간전진의 어쿠스틱 의존성을 제거하기 위해 압력과 속도 항을 암시적으로 완화시킨다. 이것은 점성과 열효과를 포함하지 않으며 낮은 차수의 정확성을 보인다.
1.2.2. 제로 마하 수 투사(Projection)
제로 마하수 공식은 1970, 1980년대에 행해진 작업에 기원한다. 이 방정식의 시작은 낮은 M 점근에서 보여지는 방정식형태로 무차원화시키는 것이다. 압력 확장과 무차원 방정식은 압력이 시간변화 ‘배경’ 압력과 M^2 에 스케일된 공간-시간-변화 압력으로 나눠질 수 있다는 것을 보여준다. 다른 중요한 결과는 압력 업데이트에 대한 깔끔한 표현을 찾을 수 있다는 것이다.
비점성 유동에서는 이 식이 오직 시간에 대해서 전체 압력 변화가 유동을 확장시킨다는 것을 암시한다. 연소에서는 이 확장은 또한 화학 열 방출과 열 전도에 의해 영향을 받는다. 이 방법은 다양한 연구자들에 의해 확장되어왔다. 이들 방법은 운동과 열 항으로부터 압축성 효과를 유지하면서 압력 분할 및 사용자가 어쿠스틱 파 전송을 제거하는 것을 허락한다. 이 방법은 낮은 마하수에서 효율적이고 정확하지만, 높은 마하수에서는 어쿠스틱 파 효과를 무시하지 못하기 때문에 제대로 작동하지 않는다.
1.2.3. 투사(Projection) 방법
투사 방법은 1960년대 Chorin에 의해 비압축성 나비어-스톡스 방정식에 처음으로 개발되었다. 투사는 발산-자유장 (divergence-free fields)의 공간으로 투영되는 속도장 예측 과정을 언급한다. 투사 방법은 많은 또는 매우 진보된 비압축성 솔버에 사용되었고, 그들은 공간과 시간에 잘 작동되었다. Colella & Pao는 새로운 투사 기법을 개발했다. 그것은 압축성 효과를 다룰수 있도록 디자인되었다. 하지만 이 방법은 점성과 열 효과를 다루지 않았고, 고차의 공간 이산화도 고려되지 않았다.
Xiao 논문. [7]
Fractional step 과정 적용.
- convective-diffusion equation 차분
F. Denner 논문.
[3] (2018) 의 논문 정리
- density-based 알고리즘은 고 마하수에서는 효과적이나 저 마하수에서는 적절하지 않다.
- 이유는, 거기서 밀도와 압력의 자연스러운 커플링이 약하기 때문이다.
- 연속방정식은 밀도에 대한 수송 방정식에 더 이상 효과적이지 않고, 속도장에 구속되어 있다.
- pressure-based 알고리즘에선, 연속방정식은 압력에 대한 방정식으로 유도되고, 밀도는 적절한 EOS를 사용하여 명시적으로 측정된다.
- 셀 센터로부터 표면 센터까지의 보간 변수는 이송되지 않으면, 표면에서 변수 값은
[5]에서는
- 이송된 변수들은 limiter 를 추가하여 보간된다.
[5]에서는,
- 이송되고 있는 속도는 다음과 같다.
[5]에서는
- 차분화된 지배 방정식으로,
셀 중심의 밀도 값은 다음과 같이 압력에 대한 암시적 함수로 구성된다.
운동량, 에너지 방정식은
[5]에서는,
여기서,
- 선형 시스템 으로 나타낼 수 있다.
위 식은 예조건화 되고, Block Jacobi 예조건화와, PETSc 라이브러리의 BiCGStab 솔버를 사용하여 해결한다. 수렴판단은 다음과 같다.
- 연속방정식에 고정된-계수 선형화를 사용하면,
뉴턴 선형화를 사용하면,
- 운동량, 에너지 방정식 선형화는 뉴턴과 고정계수 선형화를 혼합해서 사용.
운동량은
에너지는
[5]에서는,
- 반복 과정
선형 시스템은 수렴할때까지 반복된다.
L2 norm 은 레지듀얼 벡터 r 로 측정된다.
여기서  은 스케일링 팩터로써 r 의 사이즈이다.
- 싱글 루프 솔루션
- 듀얼 루프 솔루션
34식은 다음과 같다
OpenFoam 논문.
Matvey V. Kraposhin [8] 2015 [2] (2018) [9] 2020의 논문 정리
- Kurganov & Tadmor / Kurganov-Noelle-Petrova (KT/KNP) 리만해법 적용
질량 플럭스,  와  을 특성 속도에 따른 weighted mass flux 로 정의한다.
체적(volumetric) 플럭스,  와  는 특성 속도와 관련되어있다.
-원래의 KT/KNP 스킴으로부터 hybrid 접근에 대한 주요 두개의 사항은 다음과 같다.
-> positive  와 negative  convective flux 는 유동이 비압축성으로 취급해야 할 때 하나의 플럭스가 무효화 되는 반면, 두번째 플럭스는 두 플럭스의 합인 경향이 있다.
-> 보존된 물성치 (운동량 및 에너지) 들의 플럭스는 암시적인 방법으로 근사화된다.
블렌딩 펑션을 적용하면,
여기서  가 1이면 KT/KNP 플럭스가 되고, 0이면 PIMPLE 과 유사하게 행동해야만 된다. 따라서 이 함수는,
,
지배방정식을 닫고(closed), 밀도, 에너지, 압력 및 속도를 연결시키기 위해 압축성 유동에 적합한 작동자 분할 기법 (operator splitting technique) 가 적용된다. 이 알고리즘은 압력장의 변화를 이산화 압력 방정식을 통해 속도 및 밀도장의 변화와 관련시키기 위한 SIMPLE / PISO 반복 절차를 기반으로 한다.
이산화 압력 방정식은 연속 방정식의 근사와 EOS를 이용하여 운동량 방정식의 반-이산(semidiscrete) 형태로 대체하여 도출된다. 이산화 운동량 방정식은 다음과 같다.
행렬의 대각의 모든 요소가 A로 되도록 반-이산 운동량 방정식의 다른 항에서 모든 기여를 수집하면, 압력구배는 그대로 남고, 이웃 셀(비 대각항)의 헌신자들은 명시적 소스항과 함께 연산자(operator) H에 놓이게 된다.
(10)
이 식을 질량 플럭스에 대한 식과 함께 이산화 연속방정식으로 대체하면 다음과 같아진다.
이산화 압력 방정식의 최종 형태는, EOS에서 밀도 와 압축률  사이의 관계,  , 를 삽입하여 구한다. 위에서 언급한 방정식으로 일부항을 그룹화하면 대류 및 확산 항의 이산 아날로그를 포함하는 압력에 대한 방정식을 얻는다.
후자는 속도의 보정항에서 나온다. 속도의 변화는 압력구배와 관련된다. 따라서, 개발된 하이브리드 접근법을 사용하여 점성 및 비점성 유체 흐름을 모두 해결할 때 라플라시안 항에 대한 이산화 기법의 이용이 필요하다. 위 방정식의 해는 압력장으로 이어져 연속방정식 및 EOS와 일치하게 된다. 운동량 균형과 일치하는 속도장은 운동량 방정식의 이산화로부터 회복될 수 있다 (10 식). 개발 과정에서 몇가지 사실이 관찰된다.
=> PISO 알고리즘은 저속 흐름의 시뮬레이션에 적합하지만 고속에서 특성 파동 속도를 예측하는데 실패할 수 있다. 동시에 SIMPLE 알고리즘은 고속 흐름을 위해 신속하게 수렴하지만, 작은 마하수에는 적합하지 않다. 이 문제를 해결하기 위해 외부 (SIMPLE)와 내부(PISO) 루프를 혼합하는 PIMPLE 알고리즘이 선택된다.
=> 작업자 분할 방식의 주요 문제 중 하나는 에너지 방정식이 압력 방정식 이전에 해결되기 때문에 시간 단계 동안 에너지의 전체적인 보전이 어렵다는 것이다. 따라서, 압력의 업데이트는 기계적 에너지의 변화를 초래하고 결과적으로 다른 모든 변수의 변화를 초래한다. 많은 경우에 여러 SIMPLE 반복 (약 3회)을 통해 에너지 불균형을 1% 미만의 값으로 줄일 수 있다. 그러나 일부 응용 분야에서는 에너지 균형을 정확하게 유지하는 것이 중요하다. 이를 위해 압력 방정식 후 에너지 방정식의 추가 솔루션이 추가된다.
개발된 하이브리드 알고리즘을 사용하면 하나의 단일 안정성 기준으로 시뮬레이션을 수행할 수 있다. 이는 로컬 유속을 기반으로하는 CFL 수이다.
여기서 dt는 시간 이산화 증분이고, dx는 공간 이산화 단계이다. 확산 항의 암시적 이산 화법의 사용으로 인해, 시간 단계의 크기는 2차부분 도함수 근사
에 대한 안정성 기준의 영향을 받지 않는다. 여기서 D는 동점도 계수 (kinematic viscosity)와 같은, , 확산 계수이다.
Feng Xiao et al. 논문 [14]
, ,
지배방정식을 푼 다음, 밀도는 n+1로 업데이트되고, 운동량과 에너지는 중간값인  로 저장된다.
Pressure-correction projection (PCP) 스텝을 추가한다. 다음의 변형된 방정식을 풀어준다.
여기서  는 압력 수집(correction)이다. 위 첫번째 식은 다음과 같이 근사화시킬 수 있다.
그리고 압력 수집에 대한 포아송 방정식을 얻는다.
그리고 이상기체 상태방정식의 1차 미분을 쓰면 다음과 같다.
따라서
여기서, ,
FVM에서 압력수집 방정식은 다시,, 다음과 같아진다.
여기서, dp에 대한 항은 다음과 같다.
Semi-implicit 방법을 사용하고, 반복법을 고려하면 다음과 같다.
,
N_ij는 셀표면 수직벡터이고,  는 면적이다.
다음과 같은 에러가 최소화 될때까지 실행한다.
그리고 최종 업데이트한다.
,
마지막으로 EOS를 통해 압력을 업데이트 해준다.
C. M. Xisto et al. 논문 [13]
Rhie & Chow interpolation 기법을 AUSM+up으로 대체하였다.
PISO 알고리즘을 사용했다.
Prediction step :
Interface Mass flux, interface velocity, interface pressure 를 AUSM+up 으로 계산.
명시적 방법으로 연속방정식을 계산하여 밀도 값 계산.
운동량 방정식의 prediction 으로 U* 를 암시적으로 계산함.
Correction step :
오퍼레이터 H(U*)를 사용하여 속도 값을 예측한다. 여기서 압력 효과는 무시한다.
여기서 또 AUSM+up을 사용하여,  를 구한다.
운동량 방정식을 연속 방정식에 대입하고, EOS의 압축계수를 고려하여 압력 방정식을 만든다. 이 방정식으로 압력을 암시적으로 구한다.
여기서 압축계수는,  이고,  비-직교성을 고려하기 위해, 압력 포아송 방정식은 두 파트로 나뉜다.
따라서 플럭스는 다음과 같다.
속도 U** 는 새로운 압력 구배를 가지고 명시적으로 구한다.
다음으로 연속방정식으로 밀도  를 구한다.
다음으로 에너지 방정식을 풀어서 온도 T를 업데이트한다.
마지막으로 ‘압축 계수’와 새로운 ‘밀도’를 업데이트한다.
넥스트폼 [15] [16] 논문
[15]에서는 KT 기법과 PIMPLE 합친 기법을 적용했다.
와 는 2차 정확도를 가지는 제한자들(Minmod, vanLeer)로 격자면에 내삽하여 구한다.
[16] 논문에서는 속도-압력, 압력-엔탈피 연계 알고리즘을 합한 속도-압력-엔탈피 연계 알고리즘을 개발했다.
먼저 속도-압력 연계 알고리즘이다. 이 방식은 운동량 방정식의 압력 기울기 값과 연속 방정식의 플럭스 값을 동시에 갱신하여 속도와 압력 값을 획득하는 방식이다.
압력-엔탈피 연계 방식은 압력과 엔탈피의 변화가 큰 유동에 사용하기에 적합하다. 일반적인 내부 연소나 고온 고속 유동의 경우가 이에 해당된다.
앞서 두 가지 방식의 연계 알고리즘은 연속 방정식을 중심 으로 운동량 방정식이나 에너지 방정식을 동시에 계산하도록 수정하는 방식이다. 이와 같은 연계 알고리즘은 속도의 변화 와 에너지의 변화가 동시에 크게 나타나는 유동을 해석하는 경우 계산의 발산이 발생하거나 한 번의 시간 전진 해석 수 행을 위해서 내부 반복 계산 루프를 수행하여야 정확한 결과 를 도출하는 단점이 존재한다. 이와 같은 단점을 극복하기 위 해서 본 연구에서는 한번에 시간 전진 해석에서 속도-압력-엔 탈피를 동시에 연계하는 방식을 개발하였다.
===========================================================================
Nerinckx, Krista, Jan Vierendeels, and Erik Dick. "A Mach‐uniform pressure‐correction algorithm with AUSM+ flux definitions." International Journal of Numerical Methods For Heat & Fluid Flow (2006).
1. ,  , , 그리고 모멘텀 방정식 계수  구하기.
2. 모멘텀, 에너지 방정식으로 u*, E* 구하고 EOS로 T*구하고 T*로 rho* 구하기.
3. , , , 그리고 압력 방정식 계수  구하기.
4. 압력-수집 방정식 풀고, 압력 P* 업데이트
5. 구해진 압력으로 drho/dp*dP* 로 밀도 업데이트
6.  업데이트
7. 속도 수집자는 계산되고, 속도는  로 업데이트.
8. 수렴되지 않았으면 반복.
======================================================================
Yakubov, Sergey, Thierry Maquil, and Thomas Rung. "Experience using pressure-based CFD methods for Euler–Euler simulations of cavitating flows." Computers & Fluids 111 (2015): 91-104.
압축성 SIMPLE
페이스의 값은 HLLC, AUSM+, AUSM+up, Upwind, Rhie-Chow 등을 쓴다.
1. 밀도 계산 (EOS로)
2. 점성계수 계산
3. 속도 계산 (운동량 방정식 사용)
4. 압력 수집 (연속방정식 사용)
,
5. 압력구배항 무시하고 속도 업데이트 (운동량 방정식에서 압력구배만 사용)
6. 질량플럭스 업데이트 (화학종 방정식 사용)
7. relaxation factor (0.1~0.3)을 사용하여 압력 업데이트
8. 질량분율 계산
9. 난류 영역에 대한 transport 방정식 계산
10. 수렴되지 않았으면 1번으로 돌아감.
,
는 소스텀
X-모멘텀 방정식
또는
1st upwind :
Linear interpolation :
Diffusion :
Implicit 직교               T           explicit 직교
=>  x-모멘텀
RMS
========================================================
Interface 속도 및 질량유량 및 압력 구하기
Rhie-Chow’s pressure interpolation method
셀 사이 표면에서의 속도를 구하는 방법
에타는 평균 계수, 보통 0.5
[17]
셀 페이스의 속도를 찾기 위한 선형 인터폴레이션은 압력에서의 체커보드 문제를 일으킨다. 그러므로 모멘텀 인터폴레이션 기법이 사용된다. 이것은 압력장의 오실레이션을 안정화시키기 위해 압력의 3차 미분항을 추가한다.
오픈폼에서 Rhie-Chow 방법
[16] 오픈폼 interpolation 방법
[20] 에서,
A deferred-correction TDMA algorithm
Upwind differencing scheme :
압력,
위의 식은 Mach-weighted function 이다.
AL=0.1, AR=0.5,  (AUSM+)
Contravariant 속도,
Af는 표면에서의 음속
https://www.cfd-online.com/Forums/openfoam/114933-description-flux-method.html
Pressure poisson equation 은 다음과 같다.
여기서,
LHS의 두번째 항은 explicit 비-직교 correction 항 (소스항) 이다. 그리고 첫번째 항은 implicit 직교 파트(행렬 계수) 이다. 만약 위 식을 오픈폼 notation으로 다시 쓴다면,
Conservative face flux 인 phi 는 다음과 같다.
위 식에서 p equation flux 를 계산하면,
우리는 conservative face flux를 다음과 같이 사용할 수 있다.
if (simple.finalNonOrthogonalIter())
{
phi = phiHbyA - pEqn.flux();
}
여기서 flux()는?
위식을 보듯이, flux는 다음과 같은 것으로 구성되어있다.
첫번째 항: 압력 포아송 방정식의 off-diagonal 계수는 셀 센터의 압력 값과 곱해져있다.
fvMatrix.C 에서,
00895     for (direction cmpt=0; cmpt<pTraits<Type>::nComponents; cmpt++)
00896     {
00897         fieldFlux.internalField().replace
00898         (
00899             cmpt,
00900             lduMatrix::faceH(psi_.internalField().component(cmpt))
00901         );
00902     }
그리고 lduMatrix::faceH 는 lduMatrixTemplates.C 에 적용된다.
00092         for (register label face=0; face<l.size(); face++)
00093         {
00094             faceHpsi[face] =
00095                 Upper[face]*psi[u[face]]
00096               - Lower[face]*psi[l[face]];
00097         }
두번째 항 : 비-직교 explicit correction 이다.
fvMatrix.C 에서
00937     if (faceFluxCorrectionPtr_)
00938     {
00939         fieldFlux += *faceFluxCorrectionPtr_;
00940     }
https://openfoamwiki.net/index.php/SimpleFoam
1D 이송 방정식은 다음과 같다.
그리고
는 face flux 이고 이전 iteration으로부터 계산된다. 중심 포인트 P에 대한 합을 측정하기 위해,
속도와 압력에 중심차분법을 이용하면 다음과 같다.
그리고 마지막으로:
만약 공간적 주의가 적용되지 않는다면, face flux  는 셀 센터 P에서 속도들의 선형 보간에 의해 얻어지고, 그것은 P에서 압력에 커플되지 않지만 E와 W같은 이웃에서 커플된다. Diagonal 계수  이고, 이웃 셀 헌신자는  이다.
셀 중심 P의 압력이 운동량 방정식으로 어떻게 전달되는지 이해하려면 fvMatrix 클래스에서 flux() 연산자가 어떻게 정의되는지 이해하는 것이 중요하다. 플럭스 연산자의 구현을 사용하여 새로운 플럭스를 얻을 수 있다.
이전 iteration에서 값들을 사용한다. 또한 face flux를 보정하는데 사용되는 압력은 압력 방정식의 솔루션에서 구해진다. 운동량 방정식에서 셀 중심의 왼쪽과 오른쪽의 위상 플럭스에 대한 위의 두 관계를 삽입하면 다음과 같다.
Rhie-Chow interpolation in OpenFOAM 에서,,
셀 페이스에서 속도는 다음과 같다.
여기서 overbar는 interpolation을 나타내고,  는 메쉬 사이즈와 관련된다. 오픈폼은 방정식에 명시적 용어가 없으므로, Rhie-Chow 보정이 어떻게 적용되는지 알기가 힘들다. 오픈폼은 ‘Rhie-Chow의 정신에서’ 불릴지도 모르는 correction을 적용한다. 간단한 비압축성을 예로 들어보면 벡터 형태의 방정식은 다음과 같다.
icoFoam에서 UEqn.H 를 고려하면, 이송 항은 약간 다르다. 가우스 이론을 사용하면 다음과 같다.
여기서,
는 압력방정식이 해결될 때 상수로 유지될 수도 있는 속도이다. 반면 U 는 해결되야할 벡터 속도이다. 그 표면 적분이 소개될 때 하첨자에서 차이는 중요하다; 하첨자 f는 표면에서 계산되야할 항을 나타낸다. 는 셀 표면 속도와 셀 표면 수직의 스칼라 생산자로 정의된다. 셀 표면 수직의 크기는 셀 표면적이다.
오픈폼에선 다음과 같이 표현된다.
모멘텀 방정식은 행렬시스템으로 표현된다.
A와 H는 차분화 오퍼레이터 (discretization operators) 이다. 오픈폼에서의 명령어 UEqn.A() 와 UEqn.H() 로 만들 수 있다. A로 나누면 다음과 같다.
이 단계에서는 우리가 압력을 아직 업데이트 하지 않았기 때문에 위 식을 해결할 수 없다. 만약 화학 반응으로 생긴 질량분율 또는 엔탈피와 같은 스칼라 물성의 이송이 포함된다면, 우리는 U에 대한 예견을 필요로한다. 예견은 old 압력으로부터 계산된다.
이것은 U의 모멘텀 예견으로 불린다. 그래서 오직 모멘텀 방정식은 사용되지만, 압력 방정식을 만드는데 사용되는 연속방정식도 우리는 가지고 있다. 압력항을 빼고 속도를 구하면,
위 속도는 연속성을 만족하지 않고 압력의 영향이 빠졌다. 압력 방정식을 만들기 위해, 우리는 divergence 방정식을 취한다.
LHS는 비압축성에서는 0이다. 따라서,
LHS는 명시적으로 다뤄지고, 속도는 일정하게 유지된다. 오픈폼에서, 이것은 fvm대신 fvc를 사용하여 행해진다. 속도 U* 는 속도 플럭스 로 대체되고, 페이스 속도들이 항을 해결하는데에 사용될 것이다. 결과는 다음과 같다.
오픈폼은 가우스 이론을 다시 사용한다. 따라서 p의 2차 미분을 계산할 필요가 없다. 이 미분은 셀 표면에서 필요하고, 압력의 셀 센터값들을 사용한다.
PISO 루프가 끝났을 때, 속도는 압력 구배를 correct 함과 동시에 correction 된다.
위 식의 압력 구배는 가우스 이론을 다시 사용한다. 대신, 오직 셀 표면에서의 압력이 필요하다.
요약하자면, 오픈폼에서 Rhie-Chow correction을 다루기 위해 4가지 중요한 포인트가 있다.
1. phi 는 연속방정식을 해결할 때, 압력에 대한 어떤 효과들을 포함하지 않는다.
2. rUA 는 연속방정식과 마지막 속도 corrector를 수행할 때 압력에 대한 어떤 효과를 포함하지 않는다.
3. p의 라플라시안 항은 셀 표면의 p의 구배값을 사용한다. 그 구배는 이웃 표면이 아니라 이웃 셀을 사용하여 계산한다.
4. p의 구배 항은 p의 셀 표면값으로부터 계산된다.
이 방법은 explicit Rhie-Chow correction이 없더라도, Rhie-Chow처럼 진동으로 자유로운 속도를 준다.
Aguerre, Horacio J., et al. "An oscillation-free flow solver based on flux reconstruction." Journal of Computational Physics 365 (2018): 135-148.
Nerinckx, Krista, Jan Vierendeels, and Erik Dick. "A Mach‐uniform pressure‐correction algorithm with AUSM+ flux definitions." International Journal of Numerical Methods For Heat & Fluid Flow (2006).
Rhie-Chow, Peric et al.,
https://www.openfoam.com/documentation/user-guide/fvSchemes.php
interpolationSchemes : 포인트-포인트 보간
snGradSchemes : 셀 페이스에 수직에 대한 구배
gradSchemes : 구배
divSchemes : 발산(divergence)
laplacianSchemes : 라플라시안
timeScheme : 1차, 2차 시간 미분,
Xiao 논문. [7]
2차 중심차분법
1차 상류차분법
중심차분법은 수치적 불안정 발생, 상류차분법은 dissipation이 심함.
TVD 기법
, 는 limiter
,
플루언트에서,,,,, (ANSYS 19.2 Theory Guide 참고)
1. Pressure interpolation schemes
1.1. Linear
압력의 값을 평균 취한 것.
1.2. Standard
모멘텀 방정식 coefficients를 사용하여 face에서 압력값을 interpolation한다.
이 절차는 셀 중심 사이의 압력 변동이 smooth 할 때 잘 작동합니다. 제어 체적 사이의 운동량 소스 항에서 점프 또는 큰 기울기가 있는 경우 압력 프로파일은 셀면에서 높은 기울기를 가지며, 이 체계를 사용하여 보간 할 수 없습니다. 이 방식을 사용하면 셀 속도의 오버 슈트/언더 슈트에 불일치가 나타납니다.
표준 압력 보간 방식에 문제 가있는 흐름에는 강하게 소용돌이 치는 흐름과 같은 큰 신 체력을 갖는 흐름, 높은 레일리 수의 자연 대류 등이 포함됩니다. 이러한 경우, 압력 변화를 적절하게 해결하기 위해 메쉬를 경사도가 높은 영역에 포장해야합니다.
또 다른 오류 원인은 ANSYS Fluent가 벽의 정상 압력 구배가 0이라고 가정한다는 것입니다. 경계 레이어에는 유효하지만 곡률이있는 경우에는 유효하지 않습니다. 다시, 벽 압력 구배를 정확하게 설명하지 못하는 것은 벽 내외부를 가리키는 속도 벡터에서 나타난다.
1.3. Second Order
플루언트에서 기본값.
중심 자분법을 사용하여 face 압력을 재건설화한다.
이 스킴은 Standard와 Linear 보다 더 정확하다. 다상유동에서는 밀도의 큰 구배가 나타나기 때문에 이 스킴은 확산이 많이 일어나서 적절하지 않다. Standard 를 결합하면, 다상유동에서 Second Order 스킴은 다음과 같다.
이것은 메시가 직교성에서 크게 벗어난 경우, 다상유동에서의 PRESTO보다 강력하다.
1.4. Body force weighted
Body Force Weighted (체력 가중) 체계는 압력과 body force사이의 수직 구배가 일정하다고 가정하여 face에서의 압력을 계산합니다. 이것은 운동량 방정식에서 body force가 우선적으로 알려진 경우에 효과적입니다. (예 : 부력 및 축 대칭 소용돌이 계산) body force가 우세하고 메시가 직교성에서 크게 벗어난 Eulerian Multi-Fluid VOF 케이스의 경우 Body Force Weighted 구성표가 PRESTO보다 강력합니다!
1.5. PRESTO!
VOF 에서 기본값으로 사용됨.
프레스토! (PREssure Staggering Option) 방식은 face에 대한 "staggered"된 제어량에 대해 불연속 연속성 균형을 사용하여 "staggered"된 (즉, face) 압력을 계산합니다. 이 절차는 구조화된 메쉬와 함께 사용되는 staggered 그리드 방식과 유사합니다. 삼각, 사면체, 하이브리드 및 다면체 메쉬의 경우 비슷한 알고리즘을 사용하여 비슷한 정확도를 얻습니다. 프레스토! 스킴은 모든 메시에 사용 가능합니다.
2. Spatial Discretization schemes
face에서의 값은 셀 값으로 성취된다. 또한 upwind scheme이 사용된다.
2.1. first order upwind
Upstream cell의 값을 쓴다.
2.2. power-law
1차원 convection-diffusion 방정식의 정확한 해를 사용하여 구해진다.
여기서  와  는 간격  를 통과하는 동안 일정하다 위 식의 정확해는 다음과 같다.
여기서
Pe는 페클 수이다.
이것은 플루언트에서 일반적인 1차 스킴이다.
2.3. second order upwind
Taylor 시리즈 팽창을 사용하면 다음과 같다.
와  는 upstream 셀에서의 셀-중심 값과 구배이다. 그리고  은 셀 센터와 face 센터까지의 거리 벡터이다.  는 green-gauss 또는 least-square 로 구해지며, 새로운 maxima 또는 minima 를 넘지 않게 제한된다.
2.7. central differencing
2차 정확도 중심-차분법은 LES 난류 모델을 사용할 때 운동량방정식에 이용가능하다. 이 스킴은 LES계산을 증진시키기 위해 채용된다.
중심차분법은 셀 face의 값을 다음과 같이 계산한다.
0 과 1은 셀 face를 공유하는 셀들을 나타낸다.
중심차분법은 비-물리적 wiggle 현상과 unbounded 해를 생산할 수 있다는 사실은 잘 알려져있다. 그것은 수치 과정에서 안정성 문제를 야기한다. 이 안정성 문제는 중심차분법에 deffered correction을 사용하여 종종 피한다. 이 접근법에서 face 값은 다음과 같다.
오른쪽에서 첫째항인 upwind부분은 implicit 부분이고, 두번째 항인 central과 upwind의 차이를 나타내는 부분은 explicit 항이다.
여기서 UP은 upwind를 의미한다.
2.6. bounded central differencing
방금 설명과 같이 중심차분법은 정확성은 향상시키나 수치적 불안정을 야기한다. Bounded 중심차분법은 Convection boundedness 기준 (CBC)와 함께 일반화 값 다이어그램 (NVD) 접근에 기초해있다. 이 스킴은 순수한 중심차분법, 중심차분법과 2차 upwind 스킴의 블렌디드 스킴, 그리고 1차 upwind 스킴으로 구성된다. 1차 upwind는 CBC를 위반했을 때만 사용된다.
2.4. QUICK
이 기법은 hexahedral 메쉬에 사용되고, Structured grid에서 잘 맞는다. 플루언트에서는 unstructured grid에서도 사용되게끔 하며, 이것은 hexahedral에는 QUICK을, non-hexahedral 에서는 2차 upwind 스킴을 쓴다. 또한 블록 경계면에서도 2차 upwind를 쓴다.
2.5. Third-order MUSCL
이것은 중심차분법과 2차 upwind의 블렌딩 펑션으로 구성된다.
QUICK과는 다르게, MUSCL은 다양한 메쉬에 적용가능하다. 2차 upwind 스킴과 비교하면, 3차 MUSCL은 공간 정확도를 증진시키며, 모든 타입의 메쉬에 수치적 확산을 감소시킨다. 3차원에도 사용이 가능하며, 이송방정식에도 사용된다.
Diffusive flux 구하기
Diffusive flux 구하기 [12]
Cartesian mesh 에서는 D^c_e=0 이다.
첨자 M은 main이고, c는 corner이다.
[17]
S 는 셀 센터 I 와 j 를 가로지르는 페이스로 노멀라이즈 된 벡터
|x_j-x_i|는 노드 i와 j 사이의 거리
Alp_f = s*n
[18]
D_f 는 P와 N 사이의 거리
[19]
D_PF 는 셀 P와 옆셀 F까지 거리 벡터
Kozelkov, A. S., et al. "An implicit algorithm of solving Navier–Stokes equations to simulate flows in anisotropic porous media." Computers & Fluids 160 (2018): 164-174.
Przulj, Vlado P. "Generalized SIMPLE-Based Pressure Correction Method for Unstructured Colocated Grids." AIAA Journal (2016): 1542-1553.
r은 위치 벡터
Xiao 논문. [7]
- diffusive flux 차분
Time stepping : 1st order Euler / standard three-level 2nd order backward difference / 2nd order Crank-Nicolson schemes
Gradient schemes :
---정리---
<영린꺼>
연속방정식 -> 밀도
SIMPLE :
모멘텀 계수 예측 (H, A 예측)
PISO :
(화학종방정식)
에너지방정식 -> 온도
EOS -> 열역학적 계수들
압력방정식 -> 압력
EOS -> 밀도
모멘텀방정식 -> 속도
연속방정식 -> 밀도
<Kraposhin>
연속방정식 -> 밀도
SIMPLE :
모멘텀 계수 예측 (H, A 예측)
PISO :
에너지방정식 -> 온도
압력방정식 -> 압력
모멘텀방정식 -> 속도
new 질량플럭스 -> 연속방정식 -> 밀도
상태방정식(p,T) -> 밀도
<Traxinger>
SIMPLE :
모멘텀 계수 예측
PISO :
화학종방정식 -> 화학종, 밀도
에너지방정식 -> 온도
EOS -> 열역학적 계수들
압력방정식 -> 압력
압력변화(모멘텀방정식?) -> New U
<넥스트폼>
SIMPLE :
연속방정식 -> 밀도
모멘텀방정식 -> 속도
PISO :
압력방정식 -> 압력
new 플럭스
new 속도
------
에너지방정식 -> 온도
<Xisto>
연속방정식 -> 밀도
모멘텀 예측
PISO :
압력뺀 모멘텀 -> 속도
압력방정식 -> 압력
압력텀 모멘텀 -> 속도
연속방정식 -> 밀도
에너지방정식 -> 온도
EOS -> 밀도
<Nerinckx>
모멘텀 계수 예측
모멘텀방정식 -> 속도
에너지방정식 -> 온도
EOS -> 밀도
압력방정식 -> 압력
압력변화(EOS) -> 밀도
압력변화 -> new 속도
압력변화 -> new 질량플럭스
<Yakubov>
연속방정식 -> 밀도
운동량방정식 -> 속도
압력방정식 -> 압력
압력변화 -> new 속도
압력변화 -> new 질량플럭스
연속방정식 -> 밀도
Reference
[1] Chaplin, Christopher Michael. An improved all-speed projection algorithm for low Mach number flows. Diss. University of California, Berkeley, 2018.
[2] Kraposhin, Matvey V., et al. "A hybrid pressure‐based solver for nonideal single‐phase fluid flows at all speeds." International Journal for Numerical Methods in Fluids 88.2 (2018): 79-99.
[3] Denner, Fabian, Cheng-Nian Xiao, and Berend GM van Wachem. "Pressure-based algorithm for compressible interfacial flows with acoustically-conservative interface discretisation." Journal of Computational Physics 367 (2018): 192-234.
[5] Denner, Fabian, Fabien Evrard, and Berend van Wachem. "Conservative finite-volume framework and pressure-based algorithm for flows of incompressible, ideal-gas and real-gas fluids at all speeds." arXiv preprint arXiv:2002.10482 (2020).
[6] Xiao, Feng. "Unified formulation for compressible and incompressible flows by using multi-integrated moments I: one-dimensional inviscid compressible flow." Journal of Computational Physics 195.2 (2004): 629-654.
[7] Xiao, Cheng-Nian, Fabian Denner, and Berend GM van Wachem. "Fully-coupled pressure-based finite-volume framework for the simulation of fluid flows at all speeds in complex geometries." Journal of Computational Physics 346 (2017): 91-130.
[8] Kraposhin, Matvey, Arina Bovtrikova, and Sergei Strijhak. "Adaptation of Kurganov-Tadmor numerical scheme for applying in combination with the PISO method in numerical simulation of flows in a wide range of Mach numbers." Procedia Computer Science 66 (2015): 43-52.
[9] Traxinger, Christoph, et al. "A Pressure-Based Solution Framework for Sub-and Supersonic Flows Considering Real-Gas Effects and Phase Separation Under Engine-Relevant Conditions." Computers & Fluids (2020): 104452.
[10] Traxinger, Christoph, et al. "A Pressure-Based Solution Framework for Sub-and Supersonic Flows Considering Real-Gas Effects and Phase Separation Under Engine-Relevant Conditions." Computers & Fluids (2020): 104452.
[11] 압축성 유동 해석을 위한 압력 기반 해석자의 개선된 알고리즘 개발, 김태우, 길재홍
[12] Y. Jiang, A.J. Przekwas, Implicit pressure-based incompressible Navier–Stokes equations solver for unstructured meshes, AIAA 94-0305, 1994.
[13] Xisto, C. M., et al. "A hybrid pressure–density‐based algorithm for the Euler equations at all Mach number regimes." International Journal for Numerical Methods in Fluids 70.8 (2012): 961-976.
[14] Xie, Bin, et al. "A hybrid pressure–density-based Mach uniform algorithm for 2D Euler equations on unstructured grids by using multi-moment finite volume method." Journal of Computational Physics 335 (2017): 637-663.
[15] 김태우, and 길재흥. "압축성 유동 해석을 위한 압력 기반 해석자의 개선된 알고리즘 개발." 한국전산유체공학회지 22.4 (2017): 28-35.
[16] 김태우, and 신재렬. "다양한 마하수 영역의 유동 해석을 위한 Coupled 방식의 개선된 속도-압력-엔탈피 연계 알고리즘." 한국전산유체공학회지 23.4 (2018): 64-73.
[17] Koodly Ravishankara, Akshay, Huseyin Ozdemir, and Edwin van der Weide. "Implementation of a pressure based incompressible flow solver in SU2 for wind turbine applications." AIAA Scitech 2020 Forum. 2020.
[18] Komen, E. M. J., et al. "Analysis of the numerical dissipation rate of different Runge–Kutta and velocity interpolation methods in an unstructured collocated finite volume method in OpenFOAM®." Computer Physics Communications (2020): 107145.
[19] Fernandes, Celio, et al. "A coupled finite volume flow solver for the solution of incompressible viscoelastic flows." Journal of Non-Newtonian Fluid Mechanics 265 (2019): 99-115.
[20] Yang, Jian, et al. "Numerical study of transient conjugate heat transfer of the cryo-supersonic air-quenching based on a Mach-weighted pressure-based method." International Journal of Heat and Mass Transfer 134 (2019): 586-599.
