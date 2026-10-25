// Exact decimal/rational arithmetic. No binary floating point in thresholds.
export class D {
  constructor(n, d=1n) { if(d===0n) throw Error('ZERO_DENOMINATOR'); if(d<0n){n=-n;d=-d;} this.n=n;this.d=d;Object.freeze(this); }
  static of(v) {
    if(v instanceof D)return v;
    if(v===null||v===undefined||String(v).trim()==='')throw Error('MISSING_VALUE');
    const s=String(v).replace(/[,\s\u3000]/g,'');
    const m=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s);
    if(!m)throw Error('INVALID_NUMBER');
    return new D(BigInt((m[1]==='-'?'-':'')+m[2]+(m[3]||'')),10n**BigInt((m[3]||'').length));
  }
  add(v){v=D.of(v);return new D(this.n*v.d+v.n*this.d,this.d*v.d);}
  sub(v){return this.add(D.of(v).neg());}
  mul(v){v=D.of(v);return new D(this.n*v.n,this.d*v.d);}
  div(v){v=D.of(v);return new D(this.n*v.d,this.d*v.n);}
  neg(){return new D(-this.n,this.d);}
  abs(){return this.n<0n?this.neg():this;}
  cmp(v){v=D.of(v);const x=this.n*v.d-v.n*this.d;return x<0n?-1:x>0n?1:0;}
  toString(){const sign=this.n<0n?'-':'';let n=this.n<0n?-this.n:this.n;const whole=n/this.d;let rest=n%this.d,frac='';for(let i=0;i<12&&rest;i++){rest*=10n;frac+=String(rest/this.d);rest%=this.d;}return sign+whole+(frac?'.'+frac:'')+(rest?'…':'');}
  toJSON(){return {display:this.toString(),numerator:String(this.n),denominator:String(this.d)};}
}
export const sum=(xs)=>xs.reduce((a,v)=>a.add(v),D.of(0));
export function change(current,previous){
  const c=D.of(current),p=D.of(previous),delta=c.sub(p);
  if(p.cmp(0)===0)return {delta,rate:null,kind:c.cmp(0)===0?'UNCHANGED_ZERO':c.cmp(0)>0?'NEW_POSITIVE':'NEW_NEGATIVE'};
  return {delta,rate:delta.div(p.abs()).mul(100),kind:c.cmp(0)===0&&p.cmp(0)>0?'STOPPED':'RATE'};
}
export const stockResidual=(r,d)=>sum([r.openingStock?.[d],r.own?.[d],r.outsourced?.[d],r.purchased?.[d]]).sub(r.reprocessed?.[d]).sub(r.domestic?.[d]).sub(r.exported?.[d]).sub(r.otherShipped?.[d]).add(r.adjustment?.[d]).sub(r.closingStock?.[d]);
export const orderResidual=(r,d)=>D.of(r.openingOrders?.[d]).add(r.newOrders?.[d]).sub(r.progress?.[d]).sub(r.closingOrders?.[d]);
export const production=(r,d)=>D.of(r?.own?.[d]).add(r?.outsourced?.[d]);
export function utilization(r,d){const c=D.of(r?.capacity?.[d]);if(c.cmp(0)<=0)throw Error('NONPOSITIVE_CAPACITY');return D.of(r.actualOutput?.[d]).div(c).mul(100);}
export function month(value,offset=0){const s=String(value);if(!/^\d{6}$/.test(s)||+s.slice(0,4)<1900||+s.slice(4)<1||+s.slice(4)>12)throw Error('INVALID_PERIOD');const n=+s.slice(0,4)*12+(+s.slice(4)-1)+offset;return String(Math.floor(n/12)).padStart(4,'0')+String((n%12)+1).padStart(2,'0');}
export function daysInMonth(m){month(m);return new Date(Date.UTC(+m.slice(0,4),+m.slice(4),0)).getUTCDate();}
