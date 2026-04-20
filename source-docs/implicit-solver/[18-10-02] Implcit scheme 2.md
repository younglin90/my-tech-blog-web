# [18-10-02] Implcit scheme 2

> 원본: `implicit-solver/[18-10-02] Implcit scheme 2.hwp`

● LU-SGS for Preconditioned System
==========================================


여기서 은 mass fraction 임.


---> implicit

Taylor expansion 으로 선형화 시키면,

여기서 C(i)는 i셀을 포함한 그 주변 셀이다.
----------------------
I=j 일 때,

else

-----------------------
viscous spectral radius 는

여기서 은 I와 j사이의 거리.
-------------------------


------------------------
따라서, LU-SGS에서


-----------------------
<  >

-----------------------
Steger-Warming vector-splitting 기법을 이용하면, (단, 셀 경계 수직벡터는 j -> i로 가는 방향)

 이므로 정리하면,

---------------------

 이므로

                  D                                     L                          U            R
----------------------
   ->   
여기서  항을 무시하면,

결국,
Lower sweep : 
Upper sweep : 



---> implicit



-----------------------
Steger-Warming vector-splitting 기법을 이용하면, (단, 셀 경계 수직벡터는 j -> i로 가는 방향)

 이므로 정리하면,

---------------------

 이므로

                  D                                     L                          U            R
