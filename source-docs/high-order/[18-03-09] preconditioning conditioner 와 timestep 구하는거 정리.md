# [18-03-09] preconditioning conditioner 와 timestep 구하는거 정리

> 원본: `high-order/[18-03-09] preconditioning conditioner 와 timestep 구하는거 정리.hwp`

Preconditioning matrix 에 관하여.. 
  일반적으로 우리가 알고 있는 preconditioning matrix에 관해 놓치는 부분에 대해서 자세하게 설명한다. preconditioning matrix는 다음과 같다.[4,5]

  여기서 우리가 일반적으로 알고 있는 preconditioning matrix에서는 만 로 바꿔주는데 반해 여기서는 다른 derived term인 , ,  도 dash 항으로 바꿔줬다는 것을 알 수 있다. 
  numerical speed of sound(artificial speed of sound) 는 다음과 같다.



  위 식을 정리하면, 는 다음과 같다.



  [4]에서 aitificial property 들의 적절한 형태는 저속 및 저 레이놀즈 수에서 운동 방정식의 섭동 소산으로부터 다음과 같이 유추 될 수 있다.

,   ,   

  여기서 와 는 1차 order의 크기이고, 는 셀 레이놀즈 수, 은 유동의 Prandtl 수이다. 와 는 원래의 physical matrix와 같다는 것을 알 수 있다. 어떤 논문에서는 다음과 같이 쓴다.

  여기서 는 0~1 사이다.
  으로 사용할 수 있지만, 이상 기체 말고 다양한 상태방정식 유동에서 로 쓴다. (이상기체에서 써도 이득이 있다, Radespiel et al). 
  -방향의 preconditioned system의 eigenvalue 는 다음과 같다.

 

  여기서 ,  이다. 참고로 
 

2. 에 대해서...
  preconditioner인 은 steady 계산에서는 다음과 같다.


, local inviscid velocity
 또는 , local viscous velocity
,  or , user specified cut-off velocity

  여기서 는 local velocity 이고, 는 셀 Reynolds number(또는 Peclet number)에 대한 cut-off 값이다. 은 solid w
