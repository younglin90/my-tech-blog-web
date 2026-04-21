# immersed boundary method

> 원본: `IBM/immersed boundary method.docx`

Immersed Boundary Method
가상경계기법은 Peskin (1972) 에 의해 처음 소개된 이후 수십년간 발전되어왔다. 물체가 유체에 미치는 영향을 강제항(forcing term)을 통해 유체에 경계조건을 부여한다. 이러한 강제항의 적용 방식에 따라 연속적 강제(continuous forcing) 기법과 이산적 강제 (discrete forcing) 기법으로 나눠진다. 연속적 강제 기법은 주로 저 레이놀즈수 영역에서 얇고 탄성이 있는 물체 주위의 유동을 수치모사하는 데에 적합하다.
DMF (=Direct momentum forcing)
연속적 강제 IBM
Peskin 의 오리지널 방법, feedback 강제, fictitious 도메인, 프론트 트래킹, penalization 방법 등이 있다. 상대적으로 간단한 적용이 가능하지만, 확산-표면 현상이 나타난다. 정확성과 보존성이 낮아진다. 그리고 바디 안쪽을 포함하여 전체 도메인에 대해 해석이 수행된다. 이것은 특히 높은 레이놀즈수의 흐름 계산에서 많은 계산 낭비가 된다.
불연속 강제 IBM
Cut-cells, ghost-cells, one-sided interpolation 스킴 들이 포함된다.
불연속 강제 IBM은 디렉-델타 함수를 사용하지 않는다. 따라서 1차 이상의 더 높은 차수의 방법을 적용할 수 있다.
고스트-셀 IBM
유체 포인트 (fluid points)
고체 포인트 (solid points)
고스트 포인트 (Gps)
이미지 포인트 (IP)
바운더리 인터셉트 (BI)
프레쉬 포인트 (Fresh points, FPs)
3D bi-linear interpolation 방법
다음으로 바꿀 수 있다.
위 행렬을 Vandermonde 행렬이라고 한다. 여기에 바운더리 포인트(B)를 꼽사리 낀다.
No-slip 조건에서는  이다.
그리고, gradient normal 에 대한 경계조건을 적용해보고자 한다. Gradient normal은 다음과 같다.
그러면,
Sharp-Interface IBM
분류 과정
솔리드 (S), immersed (I), 유체 (F) 셀들을 분류
재건설화 과정
3단계 과정으로 구성된다. 첫번째 단계는 각 I셀의 이웃(노드를 공유하고 있는)을 찾고 그룹핑한다.  두번째 단계에서는, I 셀 중심에서 표면 수직벡터와 만나는 가장 가까운 b 포인트를 찾는다. 마지막 단계는 primitive 값들의 재건설화 값을 찾는다. 이것은 inverse-distance weighting (IDW)로 계산할 수 있다.
: i번째 이웃의 중심과 b 와의 거리
그리고, I 셀의 값을 절단화된 테일러 시리즈 확장을 사용하면,
Thin 셀이 있는 경우
첫번째 : 표면 트랙킹 알고리즘
오일러리안 각 셀 중심과 가장 가까운 솔리드의 표면(위 그림의 하늘색 포인트)을 maker 포인트로써 고려한다. 그 marker 포인트가 셀 내에 있다면, 그 셀을 인터셉티드 라고한다. 인터셉티드가 생길 수 없는 환경이 되지 않게, 유체 메쉬보다 표면 메쉬를 더 조밀하게 해야한다. 인터셉티드 셀 중에서도, thin 표면이 있는 부분을 thin(TN) 셀이라고 한다.
두번째 : 표면 경계 조건 적용
값을 표면으로부터의 수직 거리 n에 대한 2차 함수로 구성한다. 인터셉티드 셀은 두 다른 경우가 있다; 셀 중심이 솔리드 쪽에 있는 경우, 유체 쪽에 있는 경우. 표면으로부터 수직 거리 (n) 에 대한 2차 함수는 다음과 같다.
f에서 특정 위치(e)까지의 거리는
: 인터셉티드 셀의 특성길이
그러면 e위치에서의 f는
그레디언트는,
s위치에서는 이고, 여기서의 값이 결국 경계조건이므로, Dirichlet 하고 Neumann 경계조건은 다음과 같다.
그러므로, 0위치에서의 값은
세번째 : 얇은 표면에 대한 필드 확장 방법
이동-최소제곱법 IBM
MLS (Moving-Least-Squares) 전달 함수에 대한 건설
: basis 함수
: 계수 벡터
: 라그랑지안 포인트의 위치
예를들어, 선형 basis 는  이다. 계수 벡터는 weighted를 최소화함으로써 얻어진다. L2 norm 은 다음과 같다.
J를 최소화하면 다음과 같다.
따라서,
Multi-direct forcing (MDF) method (Wang et al., 2008)
Modifications (Vedovoto et al., 2015)
Direct forcing 방법
함수 G에 대한 Spreading operator (L to E) 를 정의한다.
역 operator (E to L) 는 다음과 같다.
그리고,
는 유체에 요구되는 특정 값이다. 만약 솔리드가 이동하지 않는다면,  이고, 솔리드가 이동한다면 솔리드의 속도로 값을 매긴다.
그러면,
: 라그랑지안 포인트 위치
: 오일러리안 포인트 위치
: 오일러리안 공간 간격
모멘텀 방정식의 소스텀은 다음과 같이 계산된다.
: 디렉 델타 함수
: 라그랑지안 포인트 위치
: 오일러리안 포인트 위치
: 라그랑지안 페이스에서의 힘
: 모멘텀 방정식에서의 소스항
MDF 방법에서, 초기 속도 필드는 오일러리안 메쉬에서 측정한다. 그 힘들은 immersed boundary 위에 각 포인트에서 계산된다.
: IB 위에 있는 라그랑지안 포인트
: 라그랑지안 포인트 에서의 속도 보정값
: 이산화된 델타 함수
: 오일러리안 값
: 이웃 라그랑지안 포인트 사이의 공간 간격
: 오일러리안 격자의 공간 간격
no-slip 경계 조건은 라그랑지안 포인트 에서의 속도,  가 같은 위치에서의 유동 속도랑 동일해야 한다.
: 라그랑지안 포인트 l 과 가까이 있는 오일러리안 셀들
따라서,
따라서,
따라서,
이것을 선형시스템을 만들면,
fixed rigid body
strong moving rigid body
free (arbitrary) moving rigid body
deformable body
Arbitrary motion of an object
fluid structure interaction (FSI)
,
: mass
: damping coefficient
: stiffness coefficient
: moment of inertia of an object
: torque
: fluid force
: external force
: the interpolated velocity at IB points, interpolation operator
: the desired velocity at IB points
: 2 adjacent Lagrangian points 사이의 arc length
: the Dirac delta function
: spread operator
, unit [N/m^3]
direct-forcing method
초기값 지정
속도 계산 후 업데이트
오일러리안 포인트에서 속도를 라그랑지안 포인트들로 보간 (I 오퍼레이터 사용)
라그랑지안 포인트들에서 힘 계산
라그랑지안 포인트에서 힘을 오일러리안 포인트들로 보간 (D 오퍼레이터 사용)
모멘텀항 (LBM에서는 힘 항)에 힘 term을 넣어서 계산
IB 포인트들의 positions 과 velocities를 업데이트
수렴할때까지 2-6번들 반복
implicit IB-LBM
: the solid velocities
위 식은 가 된다.
, 행렬.
force density
바운더리가 moving 이거나 deformable 이면, 매 시간마다 행렬시스템을 풀어야해서 계산 비용이 많이 든다. 그리고 A 행렬은, 2 adjacent 라그랑지은 포인트들이 충분히 가까우면 ill-conditioned 된다.
the continuous kernal distribution
커널 특징
zeroth moment condition
first moment condition
또는
force correction technique-based IB-LBM
non-slip 컨디션을 만족하기 위해, 오일러리안 포인트들에서 corrected velocities를 사용하여 보간함으로써 얻어진 라그랑지안 포인트들에서의 fluid veolocities 와 solid veolocities 랑은 같아야한다.
따라서,
, 행렬.
위의 A를 diagonal 행렬로 만드는게 force correction technique-based 의 핵심이다. 자세한 내용은 [Cai, Yunan, Sheng Li, and Jianhua Lu. "An improved immersed boundary‐lattice Boltzmann method based on force correction technique." International Journal for Numerical Methods in Fluids 87.3 (2018): 109-133.] 참고.
Deformable Bodies
Network model for deforming bodies
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
뉴턴 역학 적용
The stretching energy
The Lagrangian force density associated with the node
,
: 각 섬유의 라그랑지안 좌표, m은 정수
The bending energy
The Lagrangian force density associated with the node
,
fluid structure interaction (FSI) formulation for a single rigid body. the Newton’s equation of motion
: the components of the unknown Lagrangian vector
: the mass of the object
: the damping coefficient
: the spring stiffness coefficient
: the force
: the external sources
: the components of the relative angles of the body
: the moment of inertia
: the torque
: the external torques
Searching Algorithms
Governing equations at the interface
FSI 기법 적용
Discrete Delta Function
델타 함수는 다음과 같은 상태가 필요하다.
디렉 델타 함수의 예는 다음과 같다.
여기서 보통  를 사용한다.
다음과 같은 방법을 이용하자.
W를 계산하기 위해, 보간-확산 상호작용 조건을 적용한다.
그러면, 다음과 같은 선형방정식으로 정리된다.
여러가지를 정리하면,
영린의 IBM 방법
Divided cell (DC), divided face (DF)
Immersed point (IP), immersed face (IF)
Fluid cell (FC), solid cell (SC)
= 구조물 -> octree + AABB (회전), 내부, 외부 구분
= 구조물 주변 셀 추출 -> octree 와 AABB 사용 -> 구조물 내부셀, 구조물 표면셀과 겹치는 셀만 추출 (구조물 외부셀 제외)
= DC 찾기 -> 구조물 주변 셀에서, 구조물 표면을 포함하는 구조물 셀과, 겹치는 유체셀을 찾고 -> 유체셀과 구조물 표면이 교차한다면 -> DF 셀.
= SC 찾기 -> shell 구조는 해당 안됨 -> 하나라도 구조물 내부셀과 겹치는 유체셀이 있으면. 그것은 SC -> 반대로, 하나라도 구조물 외부셀과 겹치는 유체셀이 있으면, 그것은 FC
= DF 찾기 -> DC와 FC를 공유하고 있는 face 를 찾으면 됨.
= 각 DF의 중심점과 가장 가까운 IF를 찾아야함 -> 각 IF에 DF 중심점을 project 한 것 (PP) 이, IF 내부에 있으면 그 IF와 가장 가깝다.
= 스텐실 -> DF 와 붙어있는 FC 주변의 모든 FC들을 스텐실로 사용
= 스텐실과 PP에서의 경계조건 값을 사용하여 DF의 중심점 값을 획득.
= 경계조건 값을 추출 -> 이동 최소제곱 근사법 활용
= Dirichlet 경계 조건은 IF의 값을 임의로 넣어줘서 구한 이동 최소제곱 근사법으로 DF에서의 근사값을 DF에 넣어준다.
= Neumann 경계조건은 이동 최소제곱 근사법으로 DF에서의 근사 값을 구해준다. 아니면 그냥 셀값을 DF값으로 넣어준다
= n스텝에서는 divided cell 또는 solid cell 이었던 것이, n+1스텝에서 fluid cell 로 바뀌는 셀에서는 값을 알 수 없으므로, 이동 최소제곱 근사법으로 셀 중심 값의 근사값을 넣어준다.
이동 최소제곱 근사법
유도
따라서,
여기서,
이동 최소제곱 근사법 (gradient)
