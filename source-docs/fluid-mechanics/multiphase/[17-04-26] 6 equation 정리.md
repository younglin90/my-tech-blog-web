# [17-04-26] 6 equation 정리

> 원본: `multiphase/[17-04-26] 6 equation 정리.hwp`

!====================================================
alp1 = w1(1) 
rho1 = w1(2)
u1 = w1(3)
pre = w1(4)
eint1 = (pre + gam1*pinf1)/(gam1-1.d0)/rho1
kin1 = 0.5d0*u1*u1
Etot1 = eint1 + kin1

alp2 = 1.d0-alp1
rho2 = w2(2)
u2 = w2(3)
pre = w2(4)
eint2 = (pre + gam2*pinf2)/(gam2-1.d0)/rho2
kin2 = 0.5d0*u2*u2
Etot2 = eint2 + kin2
!====================================================


!====================================================
UU1(1) = alp1*rho1
UU1(2) = alp1*rho1*u1
UU1(3) = alp1*rho1*Etot1
UU2(1) = alp2*rho2
UU2(2) = alp2*rho2*u2
UU2(3) = alp2*rho2*Etot2

HH1(1) = 0.d0
HH1(2) = -pint
HH1(3) = -pint*uint
HH2(1) = 0.d0
HH2(2) =  pint
HH2(3) =  pint*uint

SS1(1) = 0.d0
SS1(2) =  Fd
SS1(3) =  uint*Fd
SS2(1) = 0.d0
SS2(2) = -Fd
SS2(3) = -uint*Fd

3.2.1. Zein’s HLLC-type Riemann solver






3.2.2. A modified HLLC-type Riemann solver



!====================================================
c1L = dsqrt( gam1*( pre1L + pinf1 )/rho1L )
c1R = dsqrt( gam
