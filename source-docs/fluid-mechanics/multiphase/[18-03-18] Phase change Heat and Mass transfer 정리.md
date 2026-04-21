# [18-03-18] Phase change Heat and Mass transfer 정리

> 원본: `multiphase/[18-03-18] Phase change Heat and Mass transfer 정리.hwp`

‘액체 -> 상변화 과정 -> 기체’의 대한 현상에 대해서, Navier-Stokes 방정식에 source term에 추가하는 방법을 설명한다. 최근의 상변화 모델에 대한 비교는 [9],[10]에 자세히 나와있다.

Lee model
  플루언트[6]에서는 다음과 같은 소스텀을 다룬다.

momentum : 
energy : ,  : Latent heat
mass fraction : 
, []

  [7]에서는 다음과 같은 지배방정식을 사용한다.

  continuity : 
  momentum : 
  Energy : 
  Mass fraction : 

  다음으로, a에 대해 설명한다.
  만약 이면 evaporation이 일어나고 다음과 같다.



  만약 이면 condensation이 일어나고 다음과 같다.



  Hertz Knudsen formula를 고려하면, flat 표면에서 kinetic 이론에 따라 evaporation- condensation flux를 다음과 같이 구할 수 있다.



  단위는 이고, P는 압력, T는 온도, R은 universal gas constant이다. 계수 는 일명 accommodation coefficient라 불리고, 액체 표면속으로 vapor molecules의 수용량을 보여준다. 는 vapor side에서 표면에서의 vapor partial pressure을 의미한다. Clapeyron-Clausius 방정식은 saturation 상태에서의 압력과 온도 관계식을 나타낸다.



  여기서 는 비체적을 나타내고 은 latent heat (J/kg)이다.
  Clausius-Clapeyron 방정식은 와 가 saturation 상태에 가까워지면 다음과 같음을 알 수 있다.


  
  위의 Hertz Knudsen 방정식에서 이 관계식을 사용하면 다음과 같다.



  계수 는 equilibrium condition 근처에서 1.0으로 접근한다.
  만약에 같은
