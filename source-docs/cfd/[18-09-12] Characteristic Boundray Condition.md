# [18-09-12] Characteristic Boundray Condition

> 원본: `cfd/[18-09-12] Characteristic Boundray Condition.hwp`

Navier-Stokes Characteristic Boundary Conditions (NSCBC)

=== [1] 논문 정리
1. Standard Navier–Stokes characteristic boundary conditions
  1차 오일러 방정식은 다음과 같다.

  여기서 , 
  x방향으로 1차 특성 분석(characteristic analysis)을 사용하면 다음과 같다:



  여기서 은 특성 진폭(characteristic wave amplitudes) 벡터이다. 
  경계에서 subsonic outflow 조건은 오직 만 마이너스 값이다. 그러므로 를 제외하고는 특성 진폭은 upwind 스킴으로 계산될 수 있다. 를 얻기 위해, 경계 조건과 LODI 방법[2]을 사용해야만 한다. 만약 압력이 일정하면, LODI 방정식에서  이다. 이 조건은 완벽히 반ㄴ사하고 일반적으로 사용되지 않는다. non-reflective 조건은 들어오는 웨이브를 바깥으로 나가게 하여 얻어진다.

  그러나, 이 조건은 경계 조건이 도달할 압력 표시가 없기 때문에 drifting mean pressure 로 이끌 수 있다. Poinsot & Lele [2]은 다음과 같이 추천한다.

  은 타겟 압력이고 는 relaxation 계수이다. 
  Rudy & Strickwerda 는 다음과 같이 정했다.

  여기서 은 reference length, 는 경계에서 최대 마하수, 는 음속, 는 파라미터로써 보통 0.25 값을 가진다.

2. Modified outflow characteristic-based conditions
  몇몇 연구자들은 일반 NSCBC 방법에 transverse derivatives와 점성 플럭스를 추가시켜 증진시켰다. 

  여기서 는 모든 transverse 텀을 포함하고 는 확산텀이다. Yoo & Im 은 마지막 non-reflecting 경계조건인 와 의 부분으로만 설명한다.

  따라서 는 다음과 같다.

   이고 는
