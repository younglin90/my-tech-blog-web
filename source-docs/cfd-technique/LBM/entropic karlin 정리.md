# entropic karlin 정리

> 원본: `LBM/entropic karlin 정리.hwp`

2.2. Construction of entropic discrete equilibria
the minimizer of a Lyapunov functional: 

 : convex functions
, 
 Introducing the corresponding Lagrange multipliers, , 

따라서


the convexity of  the formal solution of the minimization problem

H-function을 다음과 같이 가정하면,

 차분 속도와 함께 스텐실을 고려한다

그리고, ,  라고 하면,

그러면,
,  
이것을 풀면,
,   
the following final expression for the discrete entropic equilibrium
          (31)
여기서  는 차분 속도에 대해 Gauss-Hermite quadrature 로 얻어진 값과 같다.

2.3. Properties of discrete entropic equilibria
2.3.1. Equilibrium pressure & sound speed
음속 을 이끄는 reference pressure에서 Maxwell-Boltzmann 분포는 다음과 같다

기존 equilibrium 분포 함수의 2차 다항식은 다음과 같은데:

올바른 열역학적 압력 형태는 조건이 명시적으로 고려되어 구성되기 때문에 정확하게 복원된다
하지만 entropic equilibrium (31) 은 다음과 같이 회복된다:


따라서 엔트로픽 평형 압력 텐서는 맥스웰-볼츠만 압력 텐서에서 벗어나고, 이는 비등방성이다.
그러나 무차원속도 0.5 이하로는 무시할만한 수준이다.
... 분석을 통해, 최대 속도는 다음과 같이 얻을 수 있다.


2.3.2. Viscous dissipation at Navier-Stokes level
간단히 하기 위해 1-D system 으로 가정
결론 : polynomial 와 달리, 엔트
