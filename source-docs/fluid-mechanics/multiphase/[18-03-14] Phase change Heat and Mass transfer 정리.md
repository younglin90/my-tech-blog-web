# [18-03-14] Phase change Heat and Mass transfer 정리

> 원본: `multiphase/[18-03-14] Phase change Heat and Mass transfer 정리.hwp`

‘액체 -> 상변화 과정 -> 기체’의 대한 현상에 대해서, Navier-Stokes 방정식에 source term에 추가하는 방법을 설명한다. 상변화가 고려되고 Heat & Mass transfer 가 추가된 Navier-Stokes 방정식은 다음과 같다.[3,6]







  여기서 와 은 다음과 같다.




  열 플럭스(heat flux), 로써, Fourier’s law로 나타내면 다음과 같다.



  과 는 상변화를 나타내는 source 항으로써 다음과 같다. (만약에 이 액체에서 증발되는 기체의 mass fraction, 가 액체의 mass fraction 이라고 한다면)




  여기서 첨자 e는 기화(evaporation), c는 응축(condensation)을 나타낸다.

  [5]의 논문에서는 다음과 같이 쓴다.




  여기서 은 evaporation mass flux []이고, 는 surface density 이다. 아래 오른쪽 첫 번째 항은 Fick’s law를 사용하여 나타낸 diffusion 텀이다.
  이 논문에서는 isothermal evaporation을 가정했고 temperature equation은 풀지 않았다.  이 오직 vapor mass fraction field 에 의존한다고 하면 다음과 같다.



  isothermal 가정은 가 interface에서 일정하다는 결론에 이른다. 

Fluent
  플루언트[6]에서는 다음과 같은 소스텀을 다룬다.

momentum : 
energy : ,  : Latent heat
mass fraction : 
, []

  플루언트에서 사용하는 다상유동에서 conservation equations 은 다음과 같다.

  continuity : 
  momentum : 
  Energy : 

  [7]에서는 다음과 같은 지배방정식을 사용한다.

  continuity : 
  momentum : 
  Ene
