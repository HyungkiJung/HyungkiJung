import {D,production,sum,month,utilization} from './decimal.mjs';
const numeric=v=>{try{const n=D.of(v);return Number(n.n)/Number(n.d);}catch{return null;}};
const calc=fn=>{try{return numeric(fn());}catch{return null;}};
export function itemSeries(datasets,businessId,itemId,endMonth){
 const dyn=datasets.dynamics?.rows??[],cap=datasets.capacity?.rows??[];
 const rows=dyn.filter(r=>r.businessId===businessId&&r.itemId===itemId),cs=cap.filter(r=>r.businessId===businessId&&r.itemId===itemId);
 const index=new Map(rows.map(r=>[r.period,r])),ci=new Map(cs.map(r=>[r.period,r]));const reference=index.get(endMonth);const unit=reference?.measureUnit??null;
 const data=Array.from({length:13},(_,i)=>{const period=month(endMonth,i-12),r=index.get(period),c=ci.get(period),consistent=r&&r.measureUnit===unit;
 const metrics={};for(const d of ['amount','quantity']){metrics[d]={production:consistent?calc(()=>production(r,d)):null,shipment:consistent?calc(()=>sum([r.domestic?.[d],r.exported?.[d],r.otherShipped?.[d]])):null,stock:consistent?numeric(r.closingStock?.[d]):null};}
 const prices={};for(const [k,raw]of [['production','reportedProductionPrice'],['shipment','reportedShipmentPrice'],['stock','reportedStockPrice']]){const a=metrics.amount[k],q=metrics.quantity[k];prices[k]=consistent?numeric(r[raw]):null;prices[k+'Calculated']=a!==null&&q!==null&&q>0?a/q:null;}
 return {period,available:!!r,unitConsistent:!!consistent,metrics,prices,reportedUtilization:c?numeric(c.reportedUtilization):null,calculatedUtilization:c&&c.measureUnit===unit?calc(()=>utilization(c,'quantity')):null};
 });
 return {businessId,itemId,itemName:reference?.itemName??rows[0]?.itemName??itemId,unit,rows:data,notice:'원자료 단가는 신고값이며 단위확인 필요. 계산단가는 백만원/품목단위. 서로 같은 단위라고 가정하지 않음.'};
}
export function midClassOf(itemId){const m=/^P?(\d{2})/.exec(String(itemId));return m?m[1]:null;}
export function midClassSeries(datasets,code,endMonth){
 const all=(datasets.dynamics?.rows??[]).filter(r=>midClassOf(r.itemId)===code);
 const months=Array.from({length:13},(_,i)=>month(endMonth,i-12));const groups=new Map();
 for(const r of all){const key=JSON.stringify([r.itemId,r.measureUnit]);if(!groups.has(key))groups.set(key,{itemId:r.itemId,itemName:r.itemName??r.itemId,unit:r.measureUnit,rows:[]});groups.get(key).rows.push(r);}
 const series=[...groups.values()].map(g=>({...g,rows:months.map(period=>{const rs=g.rows.filter(r=>r.period===period),obj={period};for(const [k,f]of [['production','reportedProductionPrice'],['shipment','reportedShipmentPrice'],['stock','reportedStockPrice']]){const values=rs.map(r=>numeric(r[f])).filter(v=>v!==null);obj[k]=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;}return obj;})}));
 const legacyReference=months.map(period=>{const rows=all.filter(r=>r.period===period),obj={period};for(const [k,f]of [['production','reportedProductionPrice'],['shipment','reportedShipmentPrice'],['stock','reportedStockPrice']]){const a=rows.map(r=>numeric(r[f])).filter(v=>v!==null);obj[k]=a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}return obj;});
 return {code,series,legacyReference,notice:'기존 HTML 방식의 중분류 단순평균은 대조용 참고값. 서로 다른 품목·단위가 섞일 수 있으므로 오류 판정에 사용하지 않음. 품목·단위별 추이를 우선 확인.'};
}
