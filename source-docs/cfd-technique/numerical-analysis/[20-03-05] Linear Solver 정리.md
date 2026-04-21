# [20-03-05] Linear Solver 정리

> 원본: `numerical-analysis/[20-03-05] Linear Solver 정리.docx`

OpenFoam 에 사용된 선형솔버
Navier-Stokes 방정식의 이산화 후 선형 솔버는 Ax = b 형식의 선형 방정식을 푸는 데 필요합니다. 이러한 방정식 시스템이 직접 솔버에 비해 너무 크기 때문에 반복 방법이 솔루션을 찾는 데 사용됩니다. 선형 시스템을 반복적으로 해결하기 위해 가장 일반적으로 사용되는 방법은 Krylov subspace 방법을 사용하는 것입니다. 오픈 소스 CFD 코드 인 OpenFoam, SU2 및 Gerris에서는 주로 Krylov 솔버가 선형 시스템을 해결하는 데 사용됩니다. OpenFOAM의 일부 솔버에서는 Jacobi 및 Gauss-Seidel과 같은 더 기본적인 반복 방법이 사용됩니다.
1. Krylov Subspace 방법
을  와  에 대한 초기 추측값이라고 하자. 대략적인 솔루션 은 아핀공간 (affine space)에서 발견된다.
여기서 공간  는 정의된다.
또한 Petrov-Galerkin 조건이  에 적용되어
여기서 은 차원 m의 부분공간(subspace) 이다. 의 선택과 초기 선형시스템의 예조건화는 사용된 Krylov 부분공간 방법을 정의시킨다. 그러므로 해  의 근사화는 항상  형태이다. 여기서  는 m-1의 다항식이다.
1.1. GMRES (Generalized Minimum Residual Method)
GMRES는  와  의 Krylov 부분공간 방법이다. 에 걸쳐있는 직교 정규 행렬을 생성하는 Arnoldi의 방법이 사용된다. 이 솔버는 대칭 및 비대칭 행렬을 모두 처리할 수 있다.
1.2. Conjugate Gradient Method
이 방법은 또한 Arnoldi의 방법의 형태를 사용하지만 A가 양의 정부호 행렬(symmetric positive definite) 경우입니다. 양의 정부호 행렬의 경우 Anorldi의 방법은 Lanczos 방법으로 줄어 듭니다.  이 필요하므로 솔루션을 Krylov 하위 공간 에 직교 투영으로 만듭니다.
1.3. Biconjugate Gradient Method
이 방법은 Conjugate Gradient Method에 사용된 Lanczos 방법의 확장을 사용합니다. 해결책은  에 대한 투영과  에 수직적 입니다. 대개  이고,  은  이 아닌한 임의로 선택될 수 있다. 하지만 종종  이 선택된다.
1.4. BiCGSTAB
Biconjugate Gradient Stabilized는 transpose인 를 명시적으로 계산할 필요가 없는 방법입니다. 이 방법은 계산 시간을 줄게합니다. CGS (Conjugate Gradient Squared) 알고리즘의 개선된 버전입니다. Biconjugate Gradient Method와 비교하여, 이 방법의 장점은 더 부드럽고 빠른 수렴 속성입니다.
2. LU-SGS
SU2에서는 선형 시스템을 위한 또 다른 솔버가 구현됩니다. 고정 반복 방법 인 LU-SGS (Lower-Upper SymmetricGauss-Seidel) 방법이다.
