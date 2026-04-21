# [18-05-30] NASG EOS Thermodynamic relationships for general fluid mixtures

> 원본: `thermodynamics/[18-05-30] NASG EOS Thermodynamic relationships for general fluid mixtures.hwp`

========= 다 상 유 동    기본 방정식 =========


여기서 은 mass fraction 임.

여기서  , preconditioning matrix 임.

    

 ,   , 
, 
 , 

질량분율과 체적분율 관계 ===>    ,  

mixture 음속 ->  , 
mixture 음속 (C.A.Kim) ->  

<========= EOS for liquid ========= (1) noble-abel stiffened gas (NASG) EOS ;; parameters :: , , , ,    ,   ,       Latent heat of vaporization ->   ,   그래서,,   rp = (gam(1)/c_spec(1)**2.d0*alp(1)+gam(2)/c_spec(2)**2.d0*alp(2))         ,      ,  ==================================================== 혼합물에서의 음속    ====================================================      ====================================================  rp rt hp ht hy      >













==================================

=================================


      dslash = (rt + beta*ht*r - hp*r*rt)
      dq_solve(1) = -(rt*(usqrt - H) - ht*r - ht*sum( ry(1:nspec-1)*y(1:nspec-1) ) + rt*sum( hy(1:nspec-1)*y(1:nspec-1) ) ) / dslash * cell(i)%residual(1) + &
                (rt*u)/dslash * cell(i)%residual(2) + &
