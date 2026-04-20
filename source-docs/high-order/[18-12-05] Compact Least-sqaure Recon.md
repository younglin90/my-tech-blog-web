# [18-12-05] Compact Least-sqaure Recon

> 원본: `high-order/[18-12-05] Compact Least-sqaure Recon.hwp`

가 최소가 되는 gradient들을 찾는다. 여기서,



여기서 는 weight 로써,  이 0, 1, 2 에선 각각 1.0, 0.5, 0.25가 된다.(원본 논문에서는  을 쓰기도 한다)
여기서 와 는 표면 에 대해 왼쪽값 오른쪽값이고, 3차원에서 3차의 reconstruction은 다음과 같다. 

최소가 되는 는 다음을 만족한다.

, , 

은 에 속한 gradient 들이다. 그리고,

, 
 , ,  , 


->

->
 이므로,




->




->





-> 를 안으로 넣고, 방정식 전체에 2를 나눠주면





-> 



             , 

그리고,


여기서, 는 에 따라서 결정됨.
