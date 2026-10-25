// Transcribed from attached survey guide printed p44 / physical PDF p50.
// This is the 25-row peak table in that edition, not a complete current commodity catalog.
const peakRows=[
 ['P20130','수소','천㎥'],['P25905','스테인리스 주방용품','백만원'],['P26101','D램','백만원'],['P26102','플래시메모리','백만원'],['P26103','시스템반도체','백만원'],['P26104','혼성집적회로','백만원'],['P26106','CMOS 이미지센서','백만원'],['P26107','DDI','백만원'],['P26201','IT용LCD','천개'],['P26204','백라이트유니트','백만원'],['P26206','OLED','천개'],['P27101','방사선기기','백만원'],['P27205','온도조절기구','백만원'],
 ['P27301','광학렌즈','백만원'],['P29106','밸브','백만원'],['P29216','금형','백만원'],['P30301','자동차신생부품','백만원'],['P30401','자동차재생부품','백만원'],['P31101','유조선','CGT'],['P31102','벌크선','CGT'],['P31103','컨테이너선','CGT'],['P31104','가스및화학운반선','CGT'],['P31105','기타화물선','CGT'],['P31106','특수선박(비상업용)','CGT'],['P32002','싱크대','백만원']
];
export const builtinCatalog=Object.freeze(Object.fromEntries(peakRows.map(([itemId,name,expectedUnit])=>[itemId,Object.freeze({itemId,name,expectedUnit,mainDimension:expectedUnit==='백만원'?'amount':'quantity',capacityMethod:'PEAK',isRegional:false,sourcePage:'첨부 지침서 인쇄44쪽(PDF50), 2020년 기준판',verificationState:'VERIFIED',verificationScope:'첨부판의 피크 대상·표시단위만 확인'})])));
