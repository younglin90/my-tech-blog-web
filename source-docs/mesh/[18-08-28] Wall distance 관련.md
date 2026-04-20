# [18-08-28] Wall distance 관련

> 원본: `mesh/[18-08-28] Wall distance 관련.hwp`

- Eikonal equations

여기서  의 근사값을 Godunov Hamiltonian 으로 구하면 다음과 같다.

여기서  , , , , 

The transient hyperbolic Eikonal equation [1]
  , ( 다른 형태 : )
-> 
->   (변형 식)  , 여기서 

Hamilton-Jacobi equation [1]
Laplacian term을 추가한 것.

여기서,  이고 는 상수이다.

Poisson equation [2]


Interface Fluxes
, 

Poisson 과 Eikonal 방정식 결과 비교 [2]


##### 지금 코딩에 성공한 것은 [3]논문을 참조함

[1] Liu, C-B., P. Nithiarasu, and P. G. Tucker. "Wall distance calculation using the Eikonal/Hamilton-Jacobi equations on unstructured meshes: A finite element approach." Engineering Computations 27.5 (2010): 645-657.
[2] Watson, Rob A., William Trojak, and Paul G. Tucker. "A Simple Flux Reconstruction Approach to Solving a Poisson Equation to Find Wall Distances for Turbulence Modelling." 2018 Fluid Dynamics Conference. 2018.
[3] Bouchard, Anthony. Wall Distance Evaluation Via Eikonal Solver for RANS Applications. Diss. École Polytechnique de Montréal, 2017.
