# [18-02-28] Implicit scheme 설명

> 원본: `implicit-solver/[18-02-28] Implicit scheme 설명.hwp`

non Linear solver ::


마찬가지로
 에서 implicit 으로 가면






하지만  행렬 크기가 계산 격자 개수에 대해 증가하므로, 의 역행렬에 계산량이 방대해진다.

(1) LUSGS 기법
행렬 을 block lower triangular part인 과 block diagonal , 그리고 block upper triangle 로 decomposit 시킨다.


SGS iteration은 sweep들 마다 backward 와 forward 로 구분시켜준다.


여기서 이고, 한 개의 forward 와 backward sweep 만 사용된다면, 위의 식은 다음과 같이 간단해진다.



->
LHS에서 inviscid flux의 Jacobian들은 복잡한 riemann 솔버 대신에 1차의 upwind scheme으로 근사화된다.

여기서 는 dissipation 텀으로써 다음과 같이 Roe 기법에서와 같다.
,   
여기서 아이겐 밸류는 spectral radius의 최대값에 faction 를 추가해준 파라미터를 더해준다.
,  
 행렬은 다음과 같이 flux splitting scheme을 통해 계산된다.



Yoon 등(Implicit Navier-Stokes Solver for Three Dimensional Compressible Flows, 1992)은 다음과 같이 간소화 했다.



-> 



그러면 위의 방정식은 다음과 같아진다.




여기서  행렬을 보면 원래의 LU-SGS랑 약간 다르다.
다음과 같이 코딩한다.
Do iter = 1,Nswp
 !> Forward sweep
 Do I=1,N
  
 enddo

 CALL MPI 통신

 !> Backward sweep
 Do I= N,1,-1
  
 enddo

 CALL MPI 통신 (그러나 Nswp = 1 이면  안해줘도 됨)

enddo

BLOCK LU-SGS

지배방정식은 다음과
