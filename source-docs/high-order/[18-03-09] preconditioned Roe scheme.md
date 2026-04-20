# [18-03-09] preconditioned Roe scheme

> 원본: `high-order/[18-03-09] preconditioned Roe scheme.hwp`

Preconditioned CUSP scheme[1]

2. Flux-Difference Algorithm: Roe’s Scheme with Steady or Unsteady Preconditioning[2]
  preconditioned 된 Roe 기법은 다음과 같다.

  

  여기서  이다. 
   는 다음과 같다.



  행렬과 eigen-vector 행렬은 다음과 같다.












 그러면

=
RAR(1,1) = (abs(D + Vd)*(D - Vd + uhat))/(2*D) + (abs(D - Vd)*(D + Vd – uhat))/(2*D)
RAR(1,2) = (cd^2*nx*r*(abs(D + Vd) - abs(D - Vd)))/(2*D)
RAR(1,3) = (cd^2*ny*r*(abs(D + Vd) - abs(D – Vd)))/(2*D)
RAR(1,4) = (cd^2*nz*r*(abs(D + Vd) - abs(D – Vd)))/(2*D)
RAR(1,5) = 0
RAR(1,6) = 0

RAR(2,1) = (nx*(abs(D + Vd) - abs(D - Vd))*(D^2 - Vd^2 + 2*Vd*uhat - uhat^2))/(2*D*cd^2*r)
RAR(2,2) = ((D-Vd+uhat)*nx^2*abs(D – Vd) + 2*D*(ny^2+nz^2)*abs(uhat) + (D+Vd-uhat)*nx^2*abs(D + Vd) )/(2*D)
RAR(2,3) = (nx*ny*(Vd*abs(D + Vd) - uhat*abs(D + Vd) + D*abs(D - Vd) - Vd*abs(D - Vd) - 2*D*abs(uhat) + uhat*abs(D - Vd) + D*abs(D + Vd)))/(2*D)
RAR(2,4) = (nx*nz*(Vd*abs(D + Vd) - uhat*abs(D + Vd) + D*abs(D - Vd) - Vd*abs(D - Vd) - 2*D*abs(uhat) + uhat*abs(D - Vd)
