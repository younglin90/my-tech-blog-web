# [20-05-06] OpenFoam의 interFoam 정리

> 원본: `multiphase/[20-05-06] OpenFoam의 interFoam 정리.docx`

interFoam : 비압축성 2상 유동을 푸는 솔버
중력, 표면장력, 점성력 고려
1) 이론
d는 셀과 face 사이의 거리 벡터
Temporal subcycling :
PISO loop :
첫번째 루프 or 메쉬 이동 기법이 적용되면,
Mesh 업데이트
만약 mesh 가 변화하면은, … 이하의 과정을 수행
먼저 alphaControls.H 를 보자
다음으로 alphaEqnSubCycle.H 를 보자
다음으로 mixture.correct() 를 보자
다음으로 UEqn.H 를 보자.
MRF는 무빙메쉬에 관한것으로써 무시하고, 난류항도 무시하고, fvVectorMatrix UEqn 을 보면 압력항을 제외한 운동량 방정식인 걸 알 수 있다. 끝에 fvOptions 는 fvOptions 를 만들어주는 명령어.
createFvOptions.H 를 보면,
… UEqn.relax
relaxation coefficient를 방정식의 계수행렬에 적용시킨다.
… fvOptions.constrain(UEqn)
필드에 UEqn 저장
Solve( UEqn == fvc::reconstruct( ) ) 에서 운동량방정식을 풀고 있다. 압력구배항은 양함수 형태로 다루어진다.
… fvc::reconstruct
재건설화 기법
… Mixture.surfaceTensionForce
표면장력 계산
… ghf*fvc::snGrad(rho)
중력항 계산. 여기서 ghf 는 중력가속도 벡터와 면의 중심위치 벡터의 내적이다. 즉 중력방향 높이와 중력가속도의 곱을 계산하고 있다.
… fvc::snGrad(p_rgh)
p-rho*g*h 계산
… mesh.magSf
셀 face의 면적
… fvOptions.correct(U)
U를 계산해준다.
다음으로 pEqn.H 를 보자
… correctPhi
Phi를 수집하는 것
… rAU
1/UEqn.A -> 1/H 을 저장
… surfaceScalarField rAUf
rAUf 에 표면에서의 rAU 값을 interpolation 해준다.
… volVectorField HbyA
… surfaceScalarField phiHbyA
… if (p_rgh.needReference())
… surfaceScalarField phig
표면장력과 중력텀 계산
… phiHbyA += phig
phiHbyA 에다 phig 를 더한다
… constrainPressure(p_rgh, U, phiHbyA, rAUf, MRF)
난류항을 고려하면 난류항에 대한 항을 푼다.
영린 정리
PISO loop :
