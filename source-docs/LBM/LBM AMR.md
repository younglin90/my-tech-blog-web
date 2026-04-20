# LBM AMR

> 원본: `LBM/LBM AMR.pptx`

## 슬라이드 2
1 root/inc
2 inc/inc
3 inc/inc
4 inc/max
4 max/dec
3 dec/inc
4 inc/max
4 max/dec
3 dec/dec
2 dec/inc
3 inc/inc
4 inc/max
4 max/dec
3 dec/inc
4 inc/max
4 max/dec
3 dec/dec
2 dec/dec
1 dec/root
collision1 -> refine -> stream -> macroscopic1
collision1 -> refine -> stream -> macroscopic1
collision1 -> refine -> stream -> macroscopic1
collision1 -> stream -> boundary -> macroscopic
collision -> stream -> boundary -> macroscopic
unrefine -> collision -> refine -> stream -> macroscopic
collision1 -> stream -> boundary -> macroscopic
collision -> stream -> boundary -> macroscopic
unrefine -> macroscopic2
unrefine -> collision -> refine -> stream -> macroscopic
collision1 -> refine -> stream -> macroscopic1
collision1 -> stream -> boundary -> macroscopic
collision -> stream -> boundary -> macroscopic
unrefine -> collision -> refine -> stream -> macroscopic
collision1 -> stream -> boundary -> macroscopic
collision -> stream -> boundary -> macroscopic
unrefine -> macroscopic2
unrefine -> macroscopic2
unrefine -> macroscopic2
Collision1 : except of ghost
Stream ; none + interface + ghost + ghost’s parent
Unrefine : only interface
Macroscopic1 ; except of interface
Macroscopic2 ; only interface

## 슬라이드 4
레벨 1 -> collision (none + interface)

## 슬라이드 5
레벨 1 -> 레벨 2로 refine (레벨 1 interface -> 레벨 2 ghost)

## 슬라이드 6
레벨 1 -> streaming (none + interface + ghost)

## 슬라이드 7
레벨 2 -> collision (none + interface)

## 슬라이드 8
레벨 2 -> 레벨 3로 refine (레벨 2 interface -> 레벨 3 ghost)

## 슬라이드 9
레벨 2 -> streaming (none + interface + ghost)

## 슬라이드 10
레벨 3 -> collision (none + interface)

## 슬라이드 11
레벨 3 -> 레벨 4로 refine (레벨 3 interface -> 레벨 4 ghost)

## 슬라이드 12
레벨 3 -> streaming (none + interface + ghost)

## 슬라이드 13
레벨 4 -> collision (none + interface)

## 슬라이드 14
레벨 4 -> stream (none + interface + ghost)

## 슬라이드 15
레벨 4 -> collision (none + interface + ghost)

## 슬라이드 16
레벨 4 -> stream (none + interface + ghost)

## 슬라이드 17
레벨 4 -> 레벨 3 unrefine (ghost -> interface)

## 슬라이드 18
레벨 3 -> collision (none + interface + ghost)

## 슬라이드 19
레벨 3 -> 레벨 4로 refine (레벨 3 interface -> 레벨 4 ghost)

## 슬라이드 20
레벨 3 -> collision (none + interface + ghost)
