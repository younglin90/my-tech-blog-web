# 한영_paper review - Agglomeration

> 원본: `combustion/한영_paper review - Agglomeration.pptx`

## 슬라이드 1
Paper Review
Review of Combustion mechanism of Al particles
Korea Aerospace Univ.
High-speed Propulsion and Combustion Control Laboratory
hpc.kau.ac.kr

## 슬라이드 2
2
DPM vs DEM
DPM (Discrete Particle Method, Discrete Parcel Method)
- Eulerian-Lagrangian 해석의 기본적인 기법
- 특정 개체와 유동장의 상호작용을 Two-way coupling을 이용하여 묘사
- Parcel : 덩어리, 주머니 등의 뜻으로, 입자 수가 많을 때 묶어서 표현함
DEM (Discrete Element Method, Distinct Element Method)
- DPM에서 입자 간 상호 작용을 고려하는 모델
- Molecular dynamics와 매우 유사
- 입자 간 상호 작용을 고려하기 위해서는 입자 서로 간의 통신이 필요함
- 입자 간 상호 작용 : 충돌, 척력, 인력 등
- 입자 수가 많아질수록 Cost 증가

## 슬라이드 3
3
DPM vs DEM
DPM Networking
DEM Networking
Cost 증가의 주요 원인

## 슬라이드 4
4
기존 DEM searching algorithm
MPI를 통해 전체 domain 내 입자 리스트 구성
spray.f90
입자 사이의 거리 계산 : Pdist
입자와 가까운 입자 리스트 구성
do 1~Total particle number
do 1~Total particle number
입자 사이의 거리 계산 : Pdist
입자 사이 겹친 거리 계산
표면적 변화, 척력, 인력 계산
계산 데이터 종합하여 해당 입자에 적용
do 1~list number
two-way coupling
searching level 1
searching level 1
10번에 1번씩

## 슬라이드 5
5
기존 DEM searching algorithm
MPI를 통해 전체 domain 내 입자 리스트 구성
spray.f90
입자 사이의 거리 계산 : Pdist
입자와 가까운 입자 리스트 구성
do 1~Total particle number
do 1~Total particle number
입자 사이의 거리 계산 : Pdist
입자 사이 겹친 거리 계산
표면적 변화, 척력, 인력 계산
계산 데이터 종합하여 해당 입자에 적용
do 1~list number
two-way coupling
searching level 2
searching level 2
1번에 1번씩

## 슬라이드 6
6
기존 DEM searching algorithm
MPI를 통해 전체 domain 내 입자 리스트 구성
spray.f90
입자 사이의 거리 계산 : Pdist
입자와 가까운 입자 리스트 구성
do 1~Total particle number
do 1~Total particle number
입자 사이의 거리 계산 : Pdist
입자 사이 겹친 거리 계산
표면적 변화, 척력, 인력 계산
계산 데이터 종합하여 해당 입자에 적용
do 1~list number
two-way coupling

## 슬라이드 7
7
개선 DEM searching algorithm, Idea 1
Assumption
- 단 1개의 응집된 입자를 효율적으로 구성하기 위해 적용되는 가정
1. Center(기준)가 되는 입자는 전체 domain에서 가장 큰 지름을 갖는 입자
2. 중앙 입자를 제외한 나머지는 전체 domain에 랜덤하게 주입
3. 중앙 입자는 모든 나머지 입자들을 끌어당기는 힘을 갖는다. (인력만 계산)
4. 나머지 입자들은 중앙 입자를 향한 인력 외 상호간 인력은 무시
5. 나머지 입자들은 서로 부딪힌 경우, 척력을 계산한다.
Center : Index 1
Limitation
1. Parallel computing 불가능
- 블록 당 구성되는 Particle 구조체를 합하여 각 프로세서에서 받아 처리
- 프로세서 간 계산 불균형?에 의해 계산 시간 증가가 예상됨
2. 다중 응집 입자 구현 불가능

## 슬라이드 8
8
개선 DEM searching algorithm, Idea 1
입자의 현재 위치, 중앙 입자의 위치 이용하여
각 입자마다 Sector ID 부여
spray.f90
do 1~Total particle number
Center : Index 1
중앙 입자 기준으로 가상의 Sector 구현

## 슬라이드 9
9
개선 DEM searching algorithm, Idea 1
입자의 현재 위치, 중앙 입자의 위치 이용하여
각 입자마다 Sector ID 부여
spray.f90
do 1~Total particle number
각 sector에 존재하는 입자 번호 리스트 Array 구성
Center : Index 1
element : Particle index (주소)
size : Do loop size
구성 이유 : searching level 1 loop 횟수 감소
인접한 Sector의 입자 번호 리스트도 필요한 경우가 있음
12개의 Face, 6개의 Edge Array 구성
element : Particle index (주소)
size : Do loop size
구성 이유 : searching level 1 loop 횟수 감소
중앙 입자 기준으로 가상의 Sector 구현

## 슬라이드 10
10
개선 DEM searching algorithm, Idea 1
Sector, Face, Edge Array 구현
do 1~Total particle number
Center : Index 1
searching level 1
서로 절대 만날 일 없는 입자 위치 관계
탐색해야 할 범위를 제한하는 것
해당 입자와 가까운 입자 리스트 구성
do 1~Sector/Face/Edge Array size
입자 간 겹친 거리 계산
표면적 변화 계산, 척력 계산
계산 데이터 종합하여 해당 입자에 적용
two-way coupling
do 1~List size
searching level 1

## 슬라이드 11
11
개선 DEM searching algorithm, Idea 1
Sector, Face, Edge Array 구현
do 1~Total particle number
Center : Index 1
searching level 2
붙어있는 경우에만 척력, 표면적 계산
해당 입자와 가까운 입자 리스트 구성
do 1~Sector/Face/Edge Array size
입자 간 겹친 거리 계산
표면적 변화 계산, 척력 계산
계산 데이터 종합하여 해당 입자에 적용
two-way coupling
do 1~List size
searching level 2

## 슬라이드 12
12
개선 DEM searching algorithm, Idea 1
2. Searching level 2를 위한 입자 리스트 구성 확인
9310 particles
1. Searching level 1 – Calculation time
1 block – 16100 cells
No search
