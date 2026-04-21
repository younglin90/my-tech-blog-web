# [19-10-30] Implicit method에서 flux Jacobian splitting 유도

> 원본: `numerical-analysis/[19-10-30] Implicit method에서 flux Jacobian splitting 유도.hwp`

■ 


Roe 기법을 유도해보면...

여기서,




마하수로 나타내면 다음과 같다. (영린이가 함)






다른 형식으로 나타내면 다음과 같다.






  [1]에서는 AUSM+와 AUSM+up의 implicit을 유도한 경험이 있다. 본 연구에서는 HAUS에 대한 dissipation을 유도할 것이고, 다음부터 진행한다. AUSM+에 대한 derivatives는 다음과 같다.

AUSM+ :



 의 미분에 관해서만 논의해보자.

--------------------------------------------------------------------------------------------------------

 : 
else : 

미분하면,

 : 
else : 

 

,  : 
,  : 
 : 

,  :  
,  : 
 : 




--------------------------------------------------------------------------------------------------------








 : 
 : 
 :  
 : 



mass flux


















, 
, 
, 
, 




   (2차 미분항들은 무시)

sigmoid function :  , 

pressure term


, 
, , 또는 0


SLAU :

AUSM+ 다시 유도 :



 



 else










, 
, 
, 
, 





   (2차 미분항들은 무시)









pressure term


, 
, , 또는 0


SLAU 유도 :











 

→ 

 else

→ 


1)
