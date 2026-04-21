# Ch. 6-6  DNS of non-premixed flames

> 원본: `turbulence/Ch. 6-6  DNS of non-premixed flames.pdf` (0.3MB, 8 페이지 추출)

## 페이지 1
6.6 DNS of turbulent non-premixed flames
6.6.1 Studies of local flame structure
- · Using flamelet concept(Fig. 6.34)
· T , χ extracted and D (local flame Damkohler number D = 1/τ χ ) is
st st a a c st
calculated for each point of the flame surface defined by z = z
st

→ Integrated reaction rate, , is computed along flame normal
→ Since flamelet models assume that the flame elements in the turbulent flame

behave like laminar flames, T (D ) and  should be compared with
st a 
the corresponding quantities found in laminar stagnation point
flames(flamelet libraries ← computed using the same transport and chemical
models as the DNS

## 페이지 2
· Reference Damkohler numbers
D SE - Local Damkohler number at extinction for a steady strained laminar
a
diffusion flame
D LFA - Limit where steady laminar flamelet approach applies
a
D ext - Damkohler number where extinction
a
→ D LFA = 2D SE, D ext = 0.4D SE
a a a a

## 페이지 3
Low initial turbulence level(u' = 1.2m/s, turbulence Re = 18)
t
High initial turbulence level(u' = 6.0m/s, turbulence Re = 92)
t

## 페이지 4
- · For low initial turbulence level
→ D (local flame Damkohler number) > D LFA for all the points on the flame
a a
surface z = z → Laminar flamelet assumption is valid
st
→ Both integrated heat release rate and local temperature for the
stoichiometric conditions are in close agreement with flamelet library data
· For high initial turbulence level
→ τ(=1/χ ) decreases and D distribution shifts towards low
t st a
→ At histogram, a significant number of points have a Damkohler number
smaller that the extinction value D SE found in the flamelet library → The
a
library predict a quenched flame → Actually not quenched( ← unsteady
effects)
→ Points are more scattered( ← small scale turbulent eddies entering the
reaction zone and unsteady effects)
6.6.2 Autoignition of a turbulent non-premixed flame
- · Left
→ Autoignition occurs for the most reactive mixture fraction, z = 0.12(z =
MR st
0.055)
→ Autoignition location is shifted towards the highest temperature stream
· Right
→ Autoignition occurs for lowest values of χ

## 페이지 5
- · Infinitely fast chemistry
→ Reaction rate decreases with time
→ Maximum temperature is constant(adiabatic temperature)
· Finite rate chemistry
→ Reaction rate : 0 → max. value(just after the autoignition time) →
decrease(to the infinitely fast chemistry solution)
→ Max. temperature increases with time( < θ )
ad

## 페이지 6
- · Two parallel laminar streams of cold fuel and hot oxidizer
· Reaction starts for z → Move to z
MR st
6.6.3 Studies of global flame structure
- An increase of flame surface area(wrinkling of the flame front) induced by
turbulence motions
- An increase of the local fuel consumption rate   per unit of flame area

explained by an increase of χ at the flame front
st
- Turbulent flame brush is thickened

## 페이지 7
- ·

 - Mean fuel reaction rate


· - Mean flame surface density
·          - Local reaction rate
 

## 페이지 8
6.6.4 Three-dimensional turbulent hydrogen jet lifted flame with complex chemistry
- · Triple flame-like structure
· Diffusion flame islands → Burn the remaining fuel
· Non-premixed jet flame actually consists of partially premixed flame elements
which burn most of the fuel and produce most of the heat release
- · Difficulties - Computational resources, data storage, retrieval and processing
· Cannot handle complex geometry today
