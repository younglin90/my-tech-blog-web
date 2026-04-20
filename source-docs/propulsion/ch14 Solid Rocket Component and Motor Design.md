# ch14 Solid Rocket Component and Motor Design

> 원본: `ch14 Solid Rocket Component and Motor Design.ppt` (5.1MB)

## 슬라이드 2
14.1 Solid Rocket Motor의 구조

## 슬라이드 3
14.2 Motor case

## 슬라이드 4
14.2 Motor case

## 슬라이드 5
산화제, 연료탱크, 연소실로 이용
Filament winding 제작
각종 복합재료 섬유
14.2 Motor case

## 슬라이드 6
14.2 Motor case

## 슬라이드 7
Carbon-Carbon 복합소재 노즐 제작 모습
(ex) Composite Material

## 슬라이드 8
고체로켓의 경우 연소실, liner로 복합재료가 사용 됨
(ex) Composite Material

## 슬라이드 9
Carbon/Carbon 복합재료를
이용하여 고온에 견디는
노즐 및 각종 부속품을 제작
(ex) Composite Material

## 슬라이드 10
14.3 Nozzle Design

## 슬라이드 11
14.3 Nozzle Design

## 슬라이드 12
(6) Extended Nozzle
14.3 Nozzle Design

## 슬라이드 13
14.3 Nozzle Design

## 슬라이드 14
14.3 Nozzle Design

## 슬라이드 15
14.4 Igniter

## 슬라이드 16
14.5 Rocket motor design approach

## 슬라이드 17
14.5 Rocket motor design approach

## 슬라이드 18
14.5 Rocket motor design approach
예제 14-1 계속

## 슬라이드 19
14.5 Rocket motor design approach
예제 14-1 계속

## 슬라이드 20
14.5 Rocket motor design approach
예제 14-1 계속

## 슬라이드 21
14.5 Rocket motor design approach
예제 14-1 계속

## 슬라이드 22
14.5 Rocket motor design approach
예제 14-1 계속

## 슬라이드 23
14.5 Rocket motor design approach
예제 14-1 계속

## 슬라이드 24
14.5.1. Solid Rocket Motor 설계단계
1) 로켓 시스템 조건정리 , 이론적 계산
로켓 시스템 전체의 제한적인 조건을 정리하고 이론적 성능을 계산, 예측 함
예 ) 요구추력, 연소시간 등의 내탄도 조건
모터의 길이, 직경, 운용고도, 위험성, 화염 및 배기가스 특성 등
2) 성능 재 검토
추진제 특성 값과 그레인 형상을 토대로 압력-시간, 추력-시간 그래프와 Total Impulse 검토
요구조건을 만족하기 위한 여러 추진제의 특성치와 그레인 형상을 변화시켜 검토해 보는 과정 필요
추진제의 응력범위를 충분히 고려한 형상설계 필요
3) 발사체의 성능 예측
추력-시간 그래프와 로켓 외부 형태를 외부 공력해석 코드에 입력 발사체 비행성능 예측
조건에 만족되지 않을 경우 다시 초기조건을 변경하여 계산과정을 반복

## 슬라이드 25
14.5.1. Solid Rocket Motor 설계단계

## 슬라이드 26
14.5.2. Propellant Evaluation Program, PEP 사용법 설명
PEP 는 추진제 성능예측 프로그램으로서 개인용 컴퓨터에서 사용
Naval Weapons Center의 보고서 NWC-TP-6037 Theoretical Computations of Equilibrium Compositions, Thermodynamic Properties, and Performance Characteristics of Propellant System by D.R. Cruise, April 1979를 기본으로 하여 제작
추진제 원료 성분과 연소 생성물을 다룰 수 있으며, 추진기관의 성능과 열역학 계산결과를 제공
(1) 기본 가정
1. 노즐입구에서는 화학적으로 평형하고 단열이다.
2. 노즐내부 유동은 화학평형 또는 frozen flow라 가정한 1차원 isentropic 흐름이다.
3. 연소가스는 이상기체의 성질과 동일하다.
4. 노즐출구 압력은 작동 고도의 대기압이다.(최적 팽창)

## 슬라이드 27
14.5.2. Propellant Evaluation Program, PEP 사용법 설명
(2) 입력 파라미터
1. 추진제 조성과 각각의 질량비. 일반적으로 추진제 100g에 포함된 각 성분의 질량
참고) 코드 사용자가 직접 추진제 물성치 입력이 가능하다.
PEPCODE.DAF 또는 README 파일에 설정법이 설명되어 있음
2. 연소 압력
3. 노즐출구 압력. 이 값은 운용고도의 압력(최고 팽창한계)을 말한다.
(3) 출력 파라미터
1. 연소 생성물의 조성, 특성 값, 노즐입구의 온도 (연소실 내부)
2. 노즐 출구에서의 연소 생성물의 조성, 특성 값, 온도(다음 두 가지 경우)
a. Shifting flow
b. Frozen flow
3. 위 2의 두 가지 경우의 노즐 목/출구 면적 (손실이 없는 경우)
4. 위 2의 두 가지 경우 각각에 대한 이론적인 비추력, 추력계수, 특성배기속도

## 슬라이드 28
14.5.3. 설계 예제

## 슬라이드 29
14.5.3. 설계 예제, PEP 사용법 설명
입력부분

## 슬라이드 30
14.5.3. 설계 예제, PEP 사용법 설명
DOS 창이 뜨면 Enter 를 치고 넘어간다

## 슬라이드 31
14.5.3. 설계 예제, PEP 사용법 설명
출력부분

## 슬라이드 32
* PEP 계산 결과
14.5.3. 설계 예제, PEP 결과 해석

## 슬라이드 33
14.5.3. 설계 예제, PEP 결과 해석

## 슬라이드 34
14.5.3. 설계 예제, PEP 결과 해석

## 슬라이드 35
14.5.3. 설계 예제  (Regression rate)
예제에는 fig 11-6의 15℃ (60 ℉) Composite 추진제의 연소속도를 이용하였다.

## 슬라이드 36
14.5.3. 설계 예제

## 슬라이드 37
14.5.3. 설계 예제

## 슬라이드 38
14.5.3. 설계 예제

## 슬라이드 39
14.5.3. 설계 예제

## 슬라이드 40
14.5.3. 설계 예제

## 슬라이드 41
14.5.4. 설계된 추진제와 노즐의 형상
Outer Diameter : 0.26795 m
L : 3.71 m
Nozzle Dt : 9.45 c m , De : 28.8 cm
L/D = 13.84

## 슬라이드 42
14.5.5. 실제 로켓과 비교

## 슬라이드 43
( 과제 ) SRM 설계 문제
