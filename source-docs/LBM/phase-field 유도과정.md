# phase-field 유도과정

> 원본: `LBM/phase-field 유도과정.hwp`

[Multiphase flows of N immiscible incompressible fluids: Conservative Allen-Cahn equation and lattice Boltzmann equation method, 2020]

II. CONSERVATIVE PHASE-FIELD THEORY FOR N
IMMISCIBLE FLUIDS

상전이장 이론에서, 다상계가 불혼합성 물질이 두 개 이상 있을 때, 체적율  (0 ≤  ≤ 1)은 일반적으로 N상계계에서 i번째 불혼합성 물질을 식별하는 데 사용되며 다음과 같은 제약 조건을 가집니다:
                                     (1)

그리고 N (N ≥ 2) 개의 불혼합성 물질로 이루어진 혼합물의 총 에너지는 다음과 같이 주어질 수 있습니다.


 : a bulk free energy

 : a constant gradient parameter

문헌에서, E0(c)는 다음과 같이 평가될 수 있으며, 




βij는 상수입니다 [5,11,12]. 또한, βij, λij 및 계면 두께 D 간의 관계는 다음과 같이 표현될 수 있습니다 [11,39].



 : interfacial tickness
 : the surface tension formed between fluid  and fluid , , , 

이 연구에서 N (N ≥ 2) 개의 불혼합성 물질의 계면 추적은 이 논문의 두상 CACE(Concentration-Area Continuum Equation) 작업에서 설계되었으며, ci에 대한 이동 방정식의 진화는 다음과 같이 표현될 수 있습니다:

                               (5)

여기서 ui는 i번째 유체의 속도입니다. [14] 참고 문헌과 유사하게, 속도 ui는 두 개의 구성 요소로 분해될 수 있습니다. 하나는 계면에 수직인 속도이고 다른 하나는 외부 이송 속도입니다. 그리고 다음과 같이 표현할 수 있습니다:
