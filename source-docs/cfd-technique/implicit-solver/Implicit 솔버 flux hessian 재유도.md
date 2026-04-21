# Implicit 솔버 flux hessian 재유도

> 원본: `implicit-solver/Implicit 솔버 flux hessian 재유도.docx`

Implicit 솔버 flux hessian 재유도
중심차분법
Convective flux hessian
HAUS의 컨벡티브 플럭스는 다음과 같은 구조
따라서
그러면
HLLC mass flux
자코비안을 구해보면
가정
그러면,
다음으로 SLAU 압력 플럭스
그리고
다음으로 헤시안을 구해보면
그리고
다음으로,
Diffusive flux hessian
디퓨지브 플럭스는 다음과 같은 구조
RANS
이것에 대해 한번 더 미분해서 hessian 을 구하면
여기서 F변수들은,
F_v,1
F_v,2
F_v,3
F_v,4
RANS
바운더리
HAUS 유도
미분가능한 스무딩 함수 정의
Softtabs
Softsign
H_tau
Softmax
Softmin
Softclamp
여기서
HAUS mass flux
HAUS pressure flux
미분하면,
시그모이드 계열 함수
X에 대해 미분하면
로지스틱
Tanh 기반
Arctan 기반
Erf 기반
다항
Implicit 관련
곡률 등을 implicit 으로 유도 [1][2] ; height function 으로 유도
[3] 에서는 :
The tangential Laplacian or Laplace-Beltrami operator
The tangential gradient of a scalar function
AUSM 에 대한 implicit 유도 [4][5]
Roe 에 대한 implicit 유도 [6]
SLAU 에 대한 implicit 유도 [7]
Implicit 솔버 – 경계조건
소스텀
원래 방정식
드리클리 조건
노이만 조건
References
[1] Denner, Fabian, Fabien Evrard, and Berend Van Wachem. "Breaching the capillary time-step constraint using a coupled VOF method with implicit surface tension." Journal of Computational Physics 459 (2022): 111128.
[2] Janodet, Romain, Berend van Wachem, and Fabian Denner. "A fully-coupled algorithm with implicit surface tension treatment for interfacial flows with large density ratios." Journal of Computational Physics 520 (2025): 113520.
[3] Raessi, M., M. Bussmann, and J. Mostaghimi. "A semi‐implicit finite volume implementation of the CSF method for treating surface tension in interfacial flows." International journal for numerical methods in fluids 59.10 (2009): 1093-1110.
[4] Colonia, Simone, René Steijl, and G. Barakos. "Assessment of Implicit Implementation of the AUSM+ Method and the SST Model for Viscous High Speed Flow." (2013).
[5] Colonia, S., R. Steijl, and G. N. Barakos. "Implicit implementation of the AUSM+ and AUSM+ up schemes." International Journal for Numerical Methods in Fluids 75.10 (2014): 687-712.
[6] Carrión, M., et al. "Implementation of all‐Mach Roe‐type schemes in fully implicit CFD solvers–demonstration for wind turbine flows." International Journal for Numerical Methods in Fluids 73.8 (2013): 693-728.
[7] Shima, Eiji, and Keiichi Kitamura. "New approaches for computation of low Mach number flows." Computers & Fluids 85 (2013): 143-152.
