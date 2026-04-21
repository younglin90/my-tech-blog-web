# FEM for solid

> 원본: `FEM/FEM for solid.docx`

Finite Element Method
■ 유한요소법의 일반적인 풀이법
direct method 또는 direct equilibrium methods (직접법) -> strong form
가장 단순. 스프링, 단축봉, 트러스, 보 등에 관련된 1차원 요소 강성행렬을 유도하는데 사용
첫 번째 접근 : Force or Flexibility method
내부 힘을 미지수로.
두 번째 접근 : displacement (변위) or stiffness (강성) method <- 이게 쓰임
노드의 변위를 미지수로.
variation methods (변분법) -> weak form
2, 3차원 유한요소 방정식을 유도하는데 있어서 직접법에 비하여 쉬움.
범함수(functional) (일 또는 에너지 방정식)를 최소화하여 강성행렬 및 관계되는 요소 방정식을 생성
weighted residual methods (가중잔여법) -> weak form
범함수가 필요하지 않음. 가장 유명한게 갤러킨 방법.
■ 유한요소의 풀이 과정
요소 형태의 선정
변위 함수의 선정
변형률-변위 및 응력-변형률 관계의 정의
요소 강성행렬과 방정식의 유도
요소 방정식의 조합(assemble)을 통한 전체 행렬 구성 및 경계조건 적용
미지의 자유도에 대해 풀기
요소 변형률과 응력의 계산
■ 변형률-변위 관계
: the displacement vector
: matrix of partial differential operators
■ 응력-변형률 관계 (Constitutive Equations)
Hooke’s law
: matrix of material constants (실험으로부터 얻음)
위 케이스는 fully anisotropic material 이다.
isotropic material 케이스에서는,
여기서
: Young’s modulus
: Poisson’s ratio
: shear modulus of the material
세 관계는 다음과 같다.
■ Dynamic equilibrium equation
strong form
: vector of external body forces
■ Hamilton’s principle
"모든 허용 가능한 변위의 시간 기록 중에서, 가장 정확한 해결책은 라그랑지안 함수를 최소화합니다.“
Hamilton’s principle states:
: Lagrangian functional
: kinetic energy
: potential energy (ex, elastic strain energy)
: work done by the external forces
: solid 의 전체 체적
: surface of the solid
■ potential energy
: strain matrix
: differential operator
그러므로,
강성행렬은
의 transpose 는 이다 (symmetric). 그리고 이다.
■ kinetic energy
mass matrix
따라서,
■ work done by the external forces
따라서,
■ 결론적으로,
Hamilton’s principle을 사용하면,
따라서,
여기서,
그리고,
따라서,
그러므로,
■ Assembly of global FE equation
여기서, transient response
: matrix of damping coefficients (실험적으로 측정)
댐핑 게수는 종종 질량과 강성행렬로 표현된다 (proportional damping)
■ 요소 강성행렬 및 방정식 유도
직접법, 변분법, 가중잔여법
강성행렬의 정의
: 노달 힘
: 노달 변위
: 강성
■ 형상 함수 (shape function),
: displacement vector
tetrahedron 일 경우.
: 노드 포인트들
, 여기서 P 는 무게중심?
역행렬을 구하면,
여기서,
여기서 은 형상함수로 사용될 수 있다.
■ 변형률-변위 관계 사용하여 구하기
: strain matrix
: matrix of partial differential operators
strain energy in the 전체 도메인 of elastic solids
강성행렬은
: constant matrix
질량 행렬은
다음 공식을 활용한다.
따라서,
Dynamic system = dynamic deformations of an object
linear elasticity에서, Lagrange equations of motion을 사용할 수 있다.
kinematic & potential energies를 포함한다.
: mass matrix
: damping matrix
: stiffness matrix
: external force
: equations of equilibrium
-> : constitutive laws
-> : equations of compatibility
: the load vector
: internal force
: Young’s modulus
: strain
: area
assemble : 개별 요소를 글로벌 행렬로 조합하는 일
assemble 할 때 희소 행렬에 대한 풀이과정을 효율적으로 하기 위해, index 순서가 중요하다
strain-displacement relations
, ,
, ,
the Green-Lagrange version of these strains
Plate bending & shell elements
벤딩의 행동은 Kirchhoff and Midnlin hypothesis 와 관련이 있음.
Kirchhoff 이론은 transverse shear을 무시한다.
Mindlin element 는 이것을 포함한다.
따라서 Mindlin element 는 thick plates 또는 plates with low transverse shear stiffness 에 적절하다.
Load types for mechanic
Nodal forces
Surface forces
Body forces
Initial stress/strain forces
Lumped and consistent mass matrices
Lumped : 노달에 집중된 질량. 각 요소에 대해 총 요소 질량을 요소가 가진 노드 수로 나눈 집중된 질량 행렬
consistent :
Contact
Heat transfer
P1-P1 element, Galerkin finite element -> Galerkin least-squares (GLS)
weak formulation :
The governing equations and boundary conditions in total Lagrangian description are given as
NBC (natural boundary condition) :
VBC (velocity boundary condition) :
: the first Piola-Kirchhoff (PK1) stress tensor
: the outward normal of natural boundary
: the Cauchy stress tensor
: the imposed traction force on natural boundary
explicit nonlinear S-FEM (smoothed finite element method)
: the FEM shape function for solids in the initial configuration
: the number of nodes in each element which is 3 for linear T3 element
in standard FEM, the gradient of displacement 계산한다:
: the derivatives of the shape function at initial configuration
The governing equation for incompressible elastic solids
: the solid density
: the Cauchy’s stress
: the body force on the solid
위 식을 FEM 으로, semi-discrete solid equations in matrix form at a time step 으로 표현하면,
: the total acceleration, velocity, displacement matrix of the solid at time level n+1
: the mass matrix
: the dampness matrix
: the stiffness matrix
: the external force vector matrix
Lagrangian formulation 으로 할 때는,
Cauchy stress 는 작은 변화에 적용이 가능하다.
이것은 the first Piola-Kirchhoff stree 로부터 유도될 수 있는데, 그것은 재료 타입과 물성에 따라 결정된다.
두 타입에 대해 설명한다. (거의-비압축성 hyper-elastic 재료, 비압축성 elastic 재료)
거의-비압축성 hyper-elastic 재료 모델은 Mooney-Rivlin 재료로 묘사된다. 그것의 strain energy function 는,
큰 displacements 와 변형 구조물에는, the second Piola-Kirchhoff stress 와 the Green-Lagrangian strain 을 사용한다.
,
first Piola-Kirchhoff stree 는 second Piola-Kirchhoff stress에 를 사용하여 얻을 수 있다.
비압축성 elastic 재료에는 Hooke’s law 가 사용된다.
Extended position based dynamics
제약조건으로..
Explicit Finite Element
갤러킨 방법으로, test function 를 사용하면, weighted residual 은
2번째 항을 Gauss-Green을 사용하여 합치면,
Deformable particle model
Spring-network model for deformable bodies
membrane
영린 유도
■ Spring-network model (particle) for deformable bodies, Lagrangian
internal stresses -> elastic strain response + bending resistance + enclosed volume conservation
the stretching elastic potential (Hooke’s Law springs) -> the two vertices sharing the l-th edge
: the elastic constant associated to the edge l
: current length
: length in the stress-free configuration
the nodal forces corresponding to the elastic energy for vertices 1 and 2 connected by l :
,
또 다른 논문에서는..
the bending potential -> two elements sharing an edge, involving the four vertices of this couple of two triangles
: the bending constant
, : the initial (stress-free) and current local curvature
the local curvature is computed by measuring the variation of the angle between the unit normal vectors of two adjacent elements, and , , with the angle in the stree-free configuration.
,
the fluid volume enclosed -> incompressible membrance is constrained with a penalty force acting on the I-th-element centroid :
: the incompressibility constant
, : the current and initial enclosed volumes
: the current area of the I-th element
또 다른 논문에서는..
, 는 Lagrangian nodes 의 전체 숫자
Hydrodynamic Stresses
pressure stress + viscous stress -> the fluid on the I-th trangular element
, : the pressure
, : the viscous stress tensor on the centroid of the I-th element taken from the external (+) and internal fluid (-)
: the outward normal unit vector
Elastic Membrane
하첨자 : vertex
the Newton equation of motion is integrated with the Verlet algorithm
: interpolating the fluid velocity from surrounding lattice nodes
그러면, the velocity at the time level n+1 is computed as :
Rigid objects
updating both linear and angular velocities
,
: the particle mass
: the total force exerted by the fluid on the particle
: the total moment acting on the rigid body
: the tensor of inertia
그러면,
The stretching energy
The Lagrangian force density associated with the node
,
: 각 섬유의 라그랑지안 좌표, m은 정수
정리
Elasticity, 갤러킨 형태
9.1 소개
이 장에서는 선형 탄성의 문제를 논의합니다. 유한 요소 정식화는 갈러킨 방법에 기반하여 제시됩니다. 세 차원 선형 탄성의 지배 방정식들은 유도에 대한 자세한 처리 없이 제시됩니다. 독자가 이미 기본 가정, 개념 및 방정식에 대해 익숙하다고 가정됩니다. 세 차원 방정식은 이차원 평면 변형 및 평면 응력 문제로 축소되며 관련된 유한 요소 정식화가 제시됩니다.
9.2 탄성체의 기본 방정식
등방성이고 균질한 탄성 연속체가 고려됩니다. 우리는 연속체가 시간 t에서 외부 표면 S에 의해 경계화되는 부피 V를 차지한다고 가정합니다. 연속체는 바깥쪽 단위 법선 벡터가 n인 표면에 작용하는 표면 추진력 성분 tni의 외부 표면 추진력의 작용을 받습니다. 또한, 단위 체적당 구성 성분 Xi의 내부 본체 하중이 연속체에 작용합니다. 작용하는 힘이 표면 추진력이든 본체 하중이든 시간에 따라 변하는 동적 힘이며, 이로 인해 연속체의 탄성동학적 행동이 발생합니다. 탄성 정적 문제의 경우, 질량 행렬은 무시되고 동적 문제는 정적 탄성의 문제로 축소됩니다. 몸체에 작용하는 총 힘은
가우스의 정리를 사용하여 추진력의 표면 적분을 부피 적분으로 변환할 수 있습니다.
탄성의 미소 이론에서, 카테시안 좌표계를 참조하는 변형-변위 관계는 다음과 같습니다.
여기서 ψij는 대칭 변형 텐서이고, ui는 변위 텐서입니다. 전통적인 카테시안 좌표계 시스템에서, 여섯 개의 변형-변위 관계는 다음과 같습니다.
식 (9.2.11)의 변위 성분 u, v 및 w를 제거하여, 변형 성분 사이의 여섯 개의 독립적인 방정식인 호환성 방정식을 제공합니다. 이러한 방정식은 전통적인 형태의 직사각형 카테시안 좌표계에서 다음과 같습니다.
선형 탄성의 고전적 이론에서, 변형 텐서의 성분은 응력 텐서의 성분의 선형 함수입니다. 이 선형 관계를 후크 법칙이라고 하며, 다음과 같이 나타낼 수 있습니다.
여기서 G는 전단 탄성계수이고 α는 포아송 비율입니다. 식 (9.2.13)은 선형 탄성의 구성 법칙으로 알려져 있습니다. 이 방정식을 응력 텐서 φij에 대해 푸는 것은 다음과 같습니다.
여기서 τij는 크로네커 델타입니다.
때로는 응력-변형 관계를 램메 상수 β와 μ로 작성하는 것이 유용할 때가 있습니다. 여기서 μ는 전단 탄성계수 G와 동일합니다. 램메 상수를 사용하여 변형 텐서는 다음과 같이 응력 텐서와 관련이 있습니다.
탄성 상수들 간의 완전한 관계는 참조에서 제공됩니다. 응력의 여섯 성분과 변형의 여섯 성분 간에는 여섯 개의 방정식이 있습니다. 식 (9.2.10)을 식 (9.2.16)에 대입하면 다음과 같습니다.
이 방정식은 네비에 방정식이라고 불리며, 세 평형 방정식, 여섯 호환성 방정식 및 여섯 응력-변형 관계에 해당합니다. 이 방정식의 확장된 형태는 다음과 같습니다.
유한 요소 근사는 해결 영역을 여러 요소와 노드 지점으로 이산화하는 것으로 진행됩니다. 기저 요소 (e)가 고려되며, 변위 성분은 적절한 형상 함수 N에 의해 근사됩니다.
9.3 갤러킨 유한요소 형태
표면 추진력 tni와 본체 힘 Xi에 영향을 받는 3차원 탄성 연속체를 고려해봅시다. 문제의 해결 영역은 임의의 수의 요소로 나누어집니다. 형상 함수 Nl은 기저 요소 (e)에서 변위 성분을 설명하는 데 사용됩니다. 갈러킨 방법에 따라 다음과 같은 직교 형태를 고려합니다.
기저 요소 (e)에 약한 정식화를 적용하면 첫 번째 항에 대한 결과는 다음과 같습니다:
여기서 n j는 경계에 대한 단위 외부 법선 벡터의 성분입니다. 식 (9.3.2)를 식 (9.3.1)에 대입하면 다음과 같습니다:
Cauchy의 공식에 따르면 경계에 작용하는 추진력 성분은 응력 텐서와 관련이 있습니다.
따라서 식 (9.3.3)의 첫 번째 항은 다음과 같습니다:
응력 텐서는 변위 성분과 관련이 있으며, 식 (9.2.10) 및 (9.2.14)를 사용하여 다음과 같이 표현됩니다.
여기서 A = α/(1 - 2α)입니다. 식 (9.3.3)의 두 번째 항에 대입하면 다음과 같습니다:
식 (9.3.3)에 대입하면 다음과 같습니다:
이제 기저 요소 (e)를 고려하고, 요소 (e)의 변위 성분은 다음과 같이 근사됩니다:
이 근사를 사용하여, 식 (9.3.8)은 다음과 같습니다.
식 (9.3.10)은 모든 요소 행렬을 조립하고 형상 함수를 대체한 후 유한 요소 방정식으로 결과합니다.
2차원 문제의 경우, i와 j는 1과 2의 값을 갖습니다. 이 경우, x와 y 방향에 대해 두 개의 방정식이 얻어집니다.
요소 (e)의 질량, 강성 및 힘 행렬의 정의는 다음과 같습니다.
그리고, 미지수 행렬은
9.4 2차원 탄성체
9.5 2차원 simplex 요소
Elasticity, 변분법
10.1 소개
이 장에서는 변분 방법론과 리츠법에 기반한 탄성 문제의 유한 요소 해석에 대해 논의합니다. 현장 변수는 변위 성분으로 고려됩니다. 이 식은 비보존적 외부 힘에 대한 해밀턴 원리의 일반 형식과 3차원 탄성 엘라스토 다이내믹 유한 요소 방정식의 일반 형식으로 시작합니다. 그런 다음 문제를 2차원 평면 응력 및 평면 변형 문제로 축소합니다. 마지막으로, 축대칭 탄성 문제에 대해 논의하고 관련된 유한 요소 방정식을 제시합니다. 이 장 전체를 통틀어, 고려되는 재료는 등방성 및 균질로 가정됩니다. 자세한 요소 행렬은 1차 등차율 요소를 사용하여 유도됩니다. 고차 요소에 기반한 요소 행렬을 유도하는 데에는 이러한 공식을 확장할 수 있습니다.
10.2 해밀턴의 원리
등온 조건 하에서 표면에 추진력으로 하중이 가해진 탄성 연속체를 고려해 봅시다. 연속체의 임의의 점에서 추진력 벡터 Ti와 본체 하중 벡터 Xi가 작용합니다. 가상 변위 로 인한 이러한 힘들의 가상일은 [1]입니다.
여기서 Ti는 평면상의 한 점에서 표면추진력 벡터의 성분이며, 이 평면의 외부 단위 법선 벡터는 n이다. 코시의 공식으로부터 [2]
여기서 는 해당 점에서의 응력 텐서입니다. 식 (10.2.2)를 식 (10.2.1)의 첫 번째 항에 대입하고 가우스 적분정리를 사용하여 면적 적분을 부피 적분으로 변환하면, 식 (10.2.1)의 첫 번째 항에 식 (10.2.2)를 대입하고 면적 적분을 부피 적분으로 변환하기 위해 가우스 적분 정리를 사용하면,
미분을 수행하면,
변형 텐서는
위의 관계와 응력 텐서의 대칭성을 고려하면, 식 (10.2.4)의 마지막 항을 다음과 같이 쓸 수 있습니다.
식 (10.2.6)을 식 (10.2.4)에 대입하고 평형 방정식을 사용하여
질량 밀도가 인 경우,
식 (10.2.9)의 좌변의 첫 번째 항은
여기서 U0는 단위 부피당 변형 에너지 함수이고, U는 총 변형 에너지 함수입니다. 시간 간격 t1에서 t2까지의 식 (10.2.9)의 시간 적분은 다음과 같이 됩니다.
관성텀은
여기서 상태는 사용됨
t = t1 및 t = t2에서의 ui의 값을 알기 때문에 조건 (10.2.13)이 사용됩니다. 운동 에너지는 다음과 같이 정의됩니다.
추진력 Ti와 본체 하중 Xi에 의한 가상일을 φA로 정의하면
식 (10.2.15)와 (10.2.12)를 식 (10.2.11)에 대입하면 다음과 같습니다.
라그랑지안 불름
10.2.16은 된다
변동 기호는 가상 연산자가 공간 좌표에만 적용되므로 시간 적분 앞에 배치됩니다. 식 (10.2.18)은 해밀턴의 원리로 불리며, 시스템의 동적 평형의 법칙을 나타냅니다. 탄성동학 문제의 경우, 식
은 함수로, 그 안정된 값은 시스템의 동적 평형에 연관됩니다. 이 변분 원리는 운동 에너지 식을 영으로 설정함으로써 최소 포텐셜 에너지 원리로 축소됩니다. 결과적으로 얻는 식은 탄성 정적 문제의 함수이며, 이를 사용하여 탄성 문제의 평형 방정식을 유도할 수 있습니다.
10.3 선형 탄성체의 기본 관계
선형 변형-변위 관계와 후크 법칙에 기초한 선형 탄성의 미소 이론은 직사각형 카테시안 좌표계에서의 미소 탄성 이론의 변형-변위 관계입니다.
여기서 u, v, w는 각각 x, y, z 축을 따라의 변위 성분입니다. 식 (10.3.1)을 행렬 형태로 나타내면 다음과 같습니다.
수학적 연산자 [d]를 사용하여
변형-변위 관계식 (10.3.2)를 다음과 같이 쓸 수 있습니다.
선형 탄성의 응력-변형 관계는 탄성계수 E와 포아송비 v를 이용한 후크의 법칙에서 나온다.
여기서 는 정규응력을 나타내며, 는 전단응력을 나타냅니다. E는 탄성계수를, v는 포아송비를 나타냅니다. 그리고 G는 전단탄성계수로서, E와 와 관련이 있습니다.
식 (10.3.6)을 응력에 대해 풀고, 행렬 형태로 쓰면 다음과 같습니다.
10.4 유한 요소 근사
직사각형 카테시안 좌표계에서 3차원 단순 기저 요소(e)를 고려해봅시다. 전역 xyz-좌표계에서 노드 좌표가 알려져 있습니다. 우리는 변위 필드에 유한 요소 근사를 적용합니다. 결과적으로 얻어지는 방정식은 변위 중심 유한 요소 모델이라고 합니다. 이 모델에서 u, v 및 w의 변위 필드는 호환되며, 해결 영역에서의 연속성이 보장됩니다. 또한, 운동학적 경계 조건을 쉽게 적용할 수 있습니다. 반면, 추력 경계 조건을 만족시키려면 이를 변위 성분으로 변환해야 하며, 이는 복잡한 정식화를 제공합니다. 즉, 해결 영역이 변위 성분으로 설명될 때 경계 조건은 힘으로 주어집니다. 강제 경계 조건을 처리하려면 추력과 변위 성분 간의 관계를 사용하여 강제 경계 조건을 만족시키는 적절한 정식화를 제공해야 합니다. 변위 및 응력 중심 유한 요소 모델링에 대한 일반적인 논의는 [3, 4]의 논의를 참조하십시오.
변위 정식을 고려할 때, 변위 성분 u, v 및 w는 다음과 같이 선형 형태 함수로 근사될 수 있습니다:
여기서 a1부터 a12까지는 시간의 함수이며, 노드 변위를 통해 다음과 같이 찾을 수 있습니다.
v와 w에 대해서도 동일한 조건을 고려합니다. 조건 (10.4.2)를 식 (10.4.1)의 첫 번째에 대입합니다. 네 개의 미지수 a1부터 a4에 대해 네 개의 방정식이 얻어지며, 이는 그 후 Ui, Uj, Uk 및 Um의 함수로 해결됩니다. v와 w에 대해서도 유사한 조건을 사용하고 식 (10.4.1)의 두 번째와 세 번째에 대입합니다. 이를 통해 상수 a5부터 a12가 v와 w의 노드 값에 대한 함수로 얻어집니다. 결과는 다음과 같습니다:
Shape 함수
여기서 상수 ar, br, cr, dr, r = i, j, k, m은 노드 좌표의 함수입니다(4장 참조). 식 (10.4.3)에 의한 근사치는 공간과 시간이 주어진 형태로 분리되는 칸트로비치 유형입니다. 식 (10.4.3)을 행렬 형태로 변환합니다.
여기서 행렬 {ζ(t)}는 시간의 함수인 노드 변위 행렬입니다. 즉,
식 (10.3.5)에서 변형 행렬은 다음과 같습니다.
식 (10.4.6)에서 대체하면 다음과 같습니다.
요소 (e)의 변형 행렬은 다음과 같습니다.
Fig. 10.1에 나와 있는 단순 요소의 경우, 행렬 [B]의 요소는 다음과 같습니다.
이 행렬은 직사각형 카테시안 좌표계에서 단순 요소에 대해 상수입니다.
유한 요소 해를 얻기 위해 해밀턴의 원리를 사용합니다. 식 (10.2.9)로부터 다음과 같이 나타납니다.
기저 요소 (e)에 대한 이 방정식의 행렬 형태는 다음과 같습니다.
표면 추진력은 요소 경계 상에 분산된 추진력 {Fd}와 요소 경계의 집중된 노드 점에 작용하는 집중된 힘 {Fc}으로 나뉩니다. 분산된 힘의 가상 일은 분산된 가상 변위 φ{f}와의 곱으로 얻어지고, 집중된 경계 힘의 가상 일은 노드 점 변위 행렬 φ{ζ}와의 곱으로 얻어집니다. 후자의 경우, 집중된 힘의 영향 지점 아래의 노드 점을 선택하는 것이 편리합니다.
식 (10.3.8), (10.4.6) 및 (10.4.11)에서 식 (10.4.14)로 대체하면 다음과 같습니다.
행렬 {ζ}는 노드 점 변위 행렬이며 좌표 변수에 독립적이며, 따라서 적분 기호 바깥으로 빠져 나올 수 있습니다. φ{ζ}가 노드 점의 가상 변위이며 임의로 선택할 수 있으므로, 식 (10.4.15)의 양쪽에서 모두 생략됩니다. 해결 영역 내의 모든 요소에 대한 요소 평형 방정식을 합산하면, 식 (10.4.15)는 다음을 제공합니다.
여기서 [M], [K], 그리고 {F}는 총 전역 질량, 강성, 그리고 힘 행렬이며, {η}는 전체 미지수 노드 변위 행렬입니다. 기저 요소 (e)의 질량, 강성 및 힘 행렬은 다음과 같습니다.
식 (10.4.16)은 시간에 따른 일반 미분 방정식과 결합된 2차 방정식 시스템입니다. 공간에서 노드 변위 행렬 {ζ}이 이산화되었지만 시간에 대해 연속적인 함수이기 때문에 유한 요소 반 이산화된 평형 방정식이라고합니다. 동적 평형 방정식 (10.4.16)은 모드 방법이나 시간 영역에서의 직접 통합 기술을 통해 해결될 수 있습니다. 첫 번째 방법은 고유 주파수와 관련된 모드 벡터를 위한 방정식을 분리시킵니다. 두 번째 방법은 시간 통합 기술을 수립하고 적절한 시간 증분으로 시간을 통해 전진합니다.
가중화된 레지듀얼 방법
위의 방정식에서 ai는 결정해야 하는 계수이고, Ni는 형상 함수 또는 보간 함수입니다. 위의 방정식은 1차원 문제에 대한 것임을 유의해야 합니다. 3차원 문제에서는 3개의 미지 필드 함수가 있는데, 근사 솔루션은 다음과 같이 작성될 수 있습니다:
갤러킨 방법은, 형상 함수를 가중치 함수로 사용하는 것이다!
변분법
변화하는 량 (미분값)이 0이 되는 것을 응용.
시간 미분 항이 없는 문제의 경우, 변분 원리라고 알려진 대안적 적분 표현이 존재합니다.
가상 일 방법
강한 함수 -> 기본 지배 방정식을 그대로 풀기
약한 함수 -> 시험 함수를 도입해서 풀기
해밀턴의 원리 ->
T 는 총 운동에너지, U는 잠재 에너지, W는 힘의 잠재
변분법 = 레일리-리츠 방법 -> 변분계산과 범함수의 극한치를 구하는 방법에 의존하고, 경계조건의 일부가 범함수내에 포함되기 때문에 간단한 요소는 물론 복잡하고 요소의 강성행렬 구성에도 개념적인 제한없이 널리 사용될 수 있음. 변분법에 의하면 범함수를 적분정리 등을 사용하여 변화시켜 연속체 지배 미분 방정식인 오일러-라그랑지 방정식을 얻게 되므로 직접법에 비해 더 고도화되고 다양하게 활용됨.
리츠 방법의 일반화 -> 리츠 방법은 변분 형태로 표시된 문제의 근사해를 구하는 일반화된 방법. 미지의 변수를 포함하는 시험함수(형상함수)로 구하고자 하는 해를 먼저 가정.
가상일의 원리 -> 변분원리의 범주에 속하는 하위 원리라 할 수 있음.
The finite element … S. S. Quek, 2003
노드 위치 벡터 de
형상 함수 행렬
형상 함수를 계산하기 위해 부피 좌표를 사용한다.
노드 1의 부피 좌표는 다음과 같다.
V 는 체적이다.
부피 좌표는 또한 P와 1과 평면 234의 거리 비로 나타낼 수 있다.
그리고 다음을 유추할수있다.
식 (9.9)를 사용하면 부피 좌표와 직교 좌표 간의 관계를 쉽게 유도할 수 있습니다:
따라서
역행렬을 구하면,
사면체 부피는 다음과 같다.
Li 의 특성은 Ni 로 사용할 수 있음.
사면체의 요소에는 총 여섯개의 응력이 있다. 변형을 얻기위한 변형율은 다음과 같다.
전단 변형 행렬
Ni 를 사용하면,
변형 행렬은 상수이다. 따라서, Ke는 강성 행렬은 다음과 같다.
재료 상수 행렬 c 는 식 (2.9) 와 같다
질량 행렬은 유사하게 식 (3.75)를 사용해 얻어진다.
다음 함수를 사용하면,
질량 행렬을 구하는 다른방법은 특수한 자연 좌표계를 사용하는 것이다.
… 생략 …
노드 힘 벡터는 다음과 같이 얻을 수 있다. 그림 9.3의 2-3 엣지에 분포된 힘 fs로 로드될 경우, 다음과 같다.
만약 로드가 균형적으로 분포하면, fsx, fsy, fsz 은 일정하고, 다음과 같이 된다.
식 (9.33)에서 l3–4은 3–4 엣지의 길이입니다. 이 식은 분포된 힘이 동일하게 분배되어 두 노드에 적용됨을 의미합니다.
Introduction FEM … Tirupathie, 2012
FEM … Rogan, 2022
Solid body potential energy
운동 에너지는
노드 위치 q, 형상 함수 N 을 사용하면, u는 표현된다.
N은 시간에 독립이기 때문에,
요소 e에 대한 운동 에너지는 다음과 같다.
위 괄호 안에 있는 것은 요소 질량 행렬이다.
이 질량 행렬은 선택된 형상 함수와 일관성이 있으며, 일관성 있는(consistent) 질량 행렬이라고 합니다. 각 요소에 대한 질량 행렬은 다음 섹션에서 제공됩니다. 모든 요소를 합산하면 다음과 같습니다.
퍼텐셜 에너지는
라그랑지안 L=T-Π 를 사용하면, 우리는 운동방정식을 얻는다.
자유 진동에서는 힘이 0이므로
정상상태에서는
이므로,
이다. 이것의 일반화된 고유값 문제이다.
여기서 U 는 아이겐벡터이고, 진동 모드를 대표한다.
N-> shape function matrix
u-> displacement vector
d-> nodal displacement vector
B-> strain-displacement matrix
m-> lumped-mass matrix
k-> element stiffness matrix
U-> strain energy
Elasticity 의 기본 방정식
(Eslami, 9.2.8)
(Zienkiewicz, 17.1)
(Zienkiewicz, 2.20a)
(MUFTU, 12.1)
(Neto, 2.78)
(Sifakis, 4.2)
(Bonet, 7.32)
(Chen, 8.1)
(Logan, 16.2.24)
(Chandrupatla, 11.13)
(Pickett, 3.30a)
(Wu, 2.1a)
(LIU, 3.106)
(RAO, 12.21)
(Ochsner, 9.22)
정적해석
정적해석 중력으로 해보기..
1차원 동적해석
X 축을 따라 [0, L] 에 정의된 영역에서 일어나는 단일 축변형. 횡단면적 A로 정의.
단일 공간 차원 x, 참조 설정에서 X 인 경우.
-> 운동의 속도, -> 선형 운동량, -> 재료 밀도, -> 단위 변형 체적당 체적력, -> 변형 그레디언트 텐서의 xX 성분, -> 피올라-키르호프 응력 텐서의 xX 성분. 간단히, 는 막대의 특정 지점에서의 스트레치 를 나타내고,  는 그 결과로 발생하는 장력 T 를 나타낸다.
선형 탄성의 특수한 경우에는 다음과 같은 단순 선형 관계를 도입할 수 있다.
-> 재료의 Young’s modulus.
위 지배방정식은 다음과 같은 레지듀얼 벡터형식으로 나타낼 수 있다.
갤러킨 방법을 사용하는데, 각 방정식에 다른 가상 필드를 곱해준다. 이를 선택한 이유는, 곱하면 모두 에너지율이 되기 때문이다.
갤러킨 방법을 사용하면,
그러면,
이것은
따라서
-> 견인 B.C., -> 속도 B.C.
위 식은 약간의 불안정함으로 인해, 가상 필드에 안정화 텀을 추가시켜준다.
따라서,
따라서 안정화된 weak form 은 다음과 같다.
따라서 정리하면,
따라서 정리하면 다음과 같다
두번째 방정식에, 엄격한 부분적분을 사용하지 않아도 된다. 따라서 다음과 같이 된다.
차분화는 다음과 같다.
첫번째 방정식은, 다음과 같이 된다.
정리하면,
그리고 두번째 방정식은,
3차원 동적해석
가상 필드를 사용하면
-> B.C. 외부방향의 수직 단위 벡터
또한 두번째 방정식은 가우스 이론 없이 다음과 같이 사용할 수 있다.
위의 약한 형태의 표준 Bubnov-Galerkin 공식은 수치 진동과 불안정성을 유발할 수 있다. 따라서 SUPG 안정화된 약한 형태가 제안된다.
P와 F가 선형적인 경우, 다음과 같이 다시 쓸 수 있다.
따라서 두번째 방정식을 수정할 수 있다.
시간 적분된 안정화 항을 추가함으로써 더욱 향상될 수 있다.
여기서 는 0에서 0.5 사이를 사용한다.
차분화는 다음과 같다.
따라서,
갤러킨 FEM 유도
Traction force
따라서
-> consistent 질량 행렬
-> 내부 load 벡터
-> 체적력 벡터
-> 외부 traction 벡터
-> 외부 노드 힘 벡터
기본 방정식 유도
해밀턴의 변분 원리 -> 이 이론에 대해 좀 더 공부!!
T-> total kinetic energy
U-> potential energy of the flexible structure
W-> potential of the applied forces that are acting in the body.
-> velocity vector
-> mass density
-> elastic strains
-> stiffness material matrix
-> displacement field
-> body load vector
-> surface load vector
-> i-th concentrated load vector
Shape function 에 대한 고찰
-> approximation of displacement
-> nodal displacement
Displacement component 근사화 함수는
3차원에서,
조합하여, 방정식 시스템은 다음과 같다.
따라서,
따라서,
사면체에서,
그리고,
그리고
그러면
노드 값을 사용해 구하면,
그리고
라 하면,
그러면,
그리고
이므로, N 을 구할 수 있다.
응력-변형율 관계
변형율-변위 관계
재료 모델
탄성 (elasticity = Hooke-Element)
-> spring stiffness, -> displacement, -> force
-> Young’s modulus, -> stress, -> strain
소성 (plasticity = St.-Venant-Element)
시간-의존 행동성 재료 (Newton-Element)
-> damping constant
탄소성 (Elasto-Plasticity = Prandtl-Element)
-> elastic strain, -> plastic strain
크리프 (Maxwell-Element for Creep)
점탄성 (Kelvin-Voigt-Element for Visco-Elasticity)
진보된 점탄성 모델
점소성 (Bingham-Model)
Burghers 모델
Explicit FEM
static
T-> internal equivalent nodal force
F-> external equivalent nodal force
dynamic
Thermoelasticity 커플링
(Barber, 16.2.2)
구조해석의 분류
Bonet 의 FEM 정리
챕터 4. Kinematics (운동학)
4.4 Deformation gradient (변형 구배)
4.5 Strain (변형)
는 right Cauchy-Green 변형 텐서.
는 left Cauchy-Green 또는 Finger 텐서
는 라그랑지안 또는 Green strain 텐서
는 오일러리안 또는 Almansi strain 텐서
챕터 5. Stress and Equilibrium
5.2 Cauchy stress 텐서
5.3 Equilibrium
관성력을 무시하면,
챕터 9. 이산화와 솔루션
9.2 Kinematics 이산화
-> standard shape functions, -> 요소에 있는 노드 개수. -> 요소 노드의 초기 위치
-> 노드 파티클의 현재 위치
-> 실제 속도, -> 가상 속도
-> displacement
Right and left Cauchy-Green 텐서, C, b 는,
9.3 Equilibrium 방정식 이산화
여기서,
그러면
여기서
따라서
-> single virtual nodal velocity
이므로,
내부 노드 힘을 , 외부 노드 힘을  라 하면,
Symmetric rate of deformation tensor 는 다시 재설립 된다.
그러면,
그러면,
9.4 선형화된 equilibrium 방정식의 이산화
여기서
따라서,
여기서 neo-Hookean 재료의 경우 D는
그리고
그리고
-> surface area, -> uniform pressure, -> normal vector
따라서
그러면,
따라서
-> permutation
삼각형의 shape function
영린의 FEM (Soft Body) 정리
지배방정식
운동량 방정식(평형방정식)
가상일(=가상 power) 적용
요소에 작용하는 가상 일은,
응력 종류
the Kirchhoff stress tensor
The First Piola–Kirchhoff Stress Tensor
The Second Piola–Kirchhoff Stress Tensor
-> the Lagrangian strain tensor,
-> the time-dependent right Cauchy–Green tensor
-> the material strain rate tensor
-> the rate of deformation tensor
-> the second Piola–Kirchhoff stress tensor
응력들 관계 정리
다시 돌아오면,
이것을 선형화 하면,
여기서 (식 6.12)
그러면,
여기서
따라서,
선형화
영린의 FEM (Rigid body) 정리
지배방정식
영린의 FEM (Soft Shell) 정리
MITC3, MITC3+, MITC4, …
MITC = Mixed Interpolation Tensorial Components
요소 내부의 변위와 전단 변형률에 각각 독립적인 형상 함수를 사용
요소 내부에 제한된 수의 연결 지점을 만든다
영린의 FEM (Rigid Shell) 정리
지배방정식
