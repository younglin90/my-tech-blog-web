# [18-03-09] preconditioned AUSM scheme

> 원본: `high-order/[18-03-09] preconditioned AUSM scheme.hwp`

Preconditioned CUSP scheme[1,3,8]
  CUSP 스킴은 scalar dissipation 만큼 비싸지 않지만 충격파 흡수 특성을 유지한다. 더욱이, 그것은 자연적으로 convective 와 pressure 효과를 구분하고 그것은 preconditioning 에 이점이 있다. 
  original CUSP 는 다음과 같다.




  여기서  (conservative variables) 이다. 여기서 와 는 무차원 파라미터들이고, shock을 캡쳐하는 동안 convective 텀과 pressure 플럭스의 구분 treatment를 upwinding 하기 위해 선택된다. 결과적으로 CUSP dissipation scheme은 다음과 같이 표현된다.



  여기서 는 셀 interface의 면적이다.

,  

  여기서 는 토탈 convective dissipation을 컨트롤링하는 계수이다. 그리고 는 pressure flux 이다. overbar는 왼쪽과 오른쪽 상태의 arithmetic average를 말한다. original CUSP에서 와 는 다음과 같다.



 
  여기서,  는 face에 수직한 방향의 속도에 대한 local 마하수이다.
  original CUSP는 낮은 마하수에서 압력의 under-dissipation 같은 문제가 발생한다. 여기서 표면 마하수에 대한 추가적인 압력 disspation과 압력 텀에 대한 추가적인 속도 dissipation을 추가해준다. 
  추가적인 압력 dissipation은 CUSP 에 새로운 텀을 추가해준다.



  여기서


, , 



  마하수가 크면, 는 증가하고, 가 작아지기 때문에 pressure dissipation 텀은 작아진다. 여기서 은 preconditioner 이다.

2. Preconditioned AUSM+up[2]
  flux-split 된 numerical flux는 다음과 같다.




  mass flux는 다음과
