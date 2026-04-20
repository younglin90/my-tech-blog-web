# [18-09-12] Least-Square-Method

> 원본: `mesh/[18-09-12] Least-Square-Method.hwp`

<A multi-moment constrained finite volume method on arbitrary unstructured grids for incompressible flows Bin Xie ∗, Feng Xiao ∗, 2016 Appendix. E. 참조  ========================================================== vertex에서의 값과 1차 미분값 (2차원)  행렬을 다음과 같이 놓음.  그러면.. >

== [1] 논문 정리



  위에를 compact form 이라 한다.

------ 아래는 내가 직접 매틀랩으로 구한 것이다 ( 매틀랩 수도 역행렬 명령어는 pinv )

==[2] 논문



여기서 weighted 값은
   

  이고, inviscid 케이스에서 대부분 n=1을 사용한다.
  자세한 것은 [3]논문을 참조
== [4] 논문
F.Moukalled, FVM in CFD, Chap.9.3 에서는
cell centered 의 1차 미분값을 계산함.


--- 2차 order 로 만들기

2차 order (아래) -
 
 그리고 Gc는 다음과 같다.

2차 order (아래) -


  G_c 가 최소화시키면 다음과 같다.




내생각엔 위에처럼 안되고 아래처럼 될 것 같음.



따라서,,,,

=

 ,  ,  ,  ,  ,  ,  ,  , 
-----
 ,  ,  ,  ,  ,  ,  ,  , 
----
 ,  ,  ,  ,  , 
 ,  ,  , 
----
 ,  ,  ,  ,  ,  ,  ,  , 
---- 정리---
1 =>  , 2 =>  , 3 =>  , 
4 =>  , 5 =>  , 6 => 
7 =>  , 8 =>  , 9 => 

..........










Reference

[1] Liu, Yilang, Weiwei Zhang, and Chunna Li. "A
