# [18-09-11] Curvature 구하기_surface tension source term

> 원본: `multiphase/[18-09-11] Curvature 구하기_surface tension source term.hwp`

=============================================================================
==[1] 논문 정리

표면장력에 대한 모멘텀에 붙는 소스텀은 다음과 같다

V_p 는 셀체적. 는 표면장력 계수로써 온도에 따라 달라지긴 하지만 미미함. 온도가 급변하지 않은 조건이면 일정한 값으로 써도 무방. 그리고 여기서 표면 수직벡터와 curvature는 다음과 같다


는 다음과 같이 interpolation 하여 구한다. (distance-weighted linear interpolation)
 

이해가 안되니 다음 그림(오른쪽) 참조


아래 그림 오른쪽처럼 돼야 좋은 계산이다.




CSF 모델에서는 다음과 같이 표면장력 소스텀을 계산한다.


곡률
2차원 :: 
3차원 (내 예상) ::  

=============================================================================
==[2] 논문 정리

이 논문에서는 1차 plane surface equation을 이용해 curvature를 구했음.
일단 한 셀 내에서, volume fraction 에 의해 잘라진 단면의 질량중심을 구하고
그 질량중심에 대해, surface 방정식을 구함.
 
여기서 각 계수 (c0, c1,c2, c3, c4, c5)는 Least-square 방법을 써서 구함.
그리고 ,  은 질량중심임.





와 는 각 폴리곤의 vertex 임.

최종적으로 curvature 는 다음과 같이 구함.





=================================================
quadrature THINC 방법에서, 2차 polynomial 식으로 interface surface equation을 구하면 된다.



==[3] 논문 정리
이 논문에서는 curvature를 diffuse interface 와
