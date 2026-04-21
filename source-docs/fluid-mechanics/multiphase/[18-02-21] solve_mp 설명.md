# [18-02-21] solve_mp 설명

> 원본: `multiphase/[18-02-21] solve_mp 설명.hwp`

========= 다 상 유 동    기본 방정식 =========


여기서 은 mass fraction 임.

여기서  , preconditioning matrix 임.


 ,  , 
, 
 , 
여기서 은 액체, 는 기체라 하묜..
  ->    <- 이건 나중에.. multi component 할 때 하고 일단은 2 phase 만..

질량분율과 체적분율 관계 ===>    ,  

mixture 음속 ->  , 

== SUMMARY ===
초기조건 -> p, u, v, w, T, Y1
EOS -> rho1, rho2
mixture rho -> 

convective flux 
THINC
preconditioning
time stepping -> updating primitive variables
EOS
B.C.

<========= EOS for liquid ========= (1) noble-abel stiffened gas (NASG) EOS ;; parameters :: , , , ,    ,   ,       Latent heat of vaporization ->   ,   그래서,,   rp = (gam(1)/c_spec(1)**2.d0*alp(1)+gam(2)/c_spec(2)**2.d0*alp(2))         ,      ,  ==================================================== 혼합물에서의 음속    ====================================================      ====================================================  rp rt hp ht hy      >









--- Vigor Yang 그룹 ---



여기서  , 
 , 

 ,  , 
 ,   ,
 
<========= EOS for liquid ========= (1) noble-abel s>
