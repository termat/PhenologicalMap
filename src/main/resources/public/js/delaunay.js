class Delaunay{

    constructor(data){
        this.EPS=1e-16;
        this.minX=data.minx;
        this.minY=data.miny;
        this.width=data.width;
        this.height=data.height;
        this.data=[];
        this.node=[];
        this.elem=[];
        this.map=[];
        this.stack=[];
        this.boundary=[];
        this.boundaryID=[];
        this.node.push({x:-1.23,y:-0.5,z:0});
        this.node.push({x:2.23,y:-0.5,z:0});
        this.node.push({x:0.5,y:2.5,z:0});
        this.elem.push(new Array(0,1,2));
        this.map.push(new Array(-1,-1,-1));
        this.ids=0;
        this.bs=1;
    }

    clear(){
        this.data=[];
        this.node=[];
        this.elem=[];
        this.map=[];
        this.stack=[];
        this.boundary=[];
        this.boundaryID=[];
        this.node.push({x:-1.23,y:-0.5,z:0});
        this.node.push({x:2.23,y:-0.5,z:0});
        this.node.push({x:0.5,y:2.5,z:0});
        this.elem.push(new Array(0,1,2));
        this.map.push(new Array(-1,-1,-1));
        this.ids=0;
        this.bs=1;
    }

    getTriangleById(){
        let et=[];
        let id=0;
        for(let i=0;i<this.elem.length;i++){
            if(!this.checkBounds(i)){
                et.push(-1);
            }else if(!this.checkBoundaryState(i)){
                et.push(-1);
            }else{
                et.push(id++);
            }
        }
        let ee=[];
        for(let i=0;i<et.length;i++){
            let e=this.elem[i];
            if(et[i]!==-1){
                ee.push(new Array(e[0]-3,e[1]-3,e[2]-3));
            }
        }
        return ee;
    }

    getTriangleMapById(){
        let et=[];
        let id=0;
        for(let i=0;i<this.elem.length;i++){
            if(!this.checkBounds(i)){
                et.push(-1);
            }else if(!this.checkBoundaryState(i)){
                et.push(-1);
            }else{
                et.push(id++);
            }
        }
        let ee=[];
        let tp=[];
        for(let i=0;i<et.length;i++){
            let e=this.map[i];
            if(et[i]!==-1){
                for(var j=0;j<e.length;j++){
                    if(e[j]===-1){
                        tp[j]=-1;
                    }else{
                        tp[j]=et[e[j]];
                    }
                }
                ee.push(new Array(tp[0],tp[1],tp[2]));
            }
        }
        return ee;
    }

    getTriangle(){
        let et=[];
        let id=0;
        for(let i=0;i<this.elem.length;i++){
            if(!this.checkBounds(i)){
                et.push(-1);
            }else if(!this.checkBoundaryState(i)){
                et.push(-1);
            }else{
                et.push(id++);
            }
        }
        let ee=[];
        for(let i=0;i<et.length;i++){
            let e=this.elem[i];
            if(et[i]!==-1){
                let p0=this.data[e[0]-3];
                let p1=this.data[e[1]-3];
                let p2=this.data[e[2]-3];
                ee.push(new Array(p0,p1,p2));
            }
        }
        return ee;
    }

    isLeft=function(a,b,p){
        let v0=(a.y-p.y)*(b.x-p.x);
        let v1=(a.x-p.x)*(b.y-p.y);
        if(Math.abs(v1-v0)<this.EPS){
            return 0;
        }else{
            return (v1-v0);
        }
    }

    getLocation(id,p){
        let e=this.elem[id];
        for(let i=0;i<e.length;i++){
            let a=this.node[e[i]];
            let b=this.node[e[(i+1)%3]];
            if(this.isLeft(a,b,p)<0){
                let n=this.map[id][i];
                if(n===-1){
                    return -1;
                }
                return this.getLocation(n,p);
            }
        }
        return id;
    }

    checkBoundaryState(id){
        if(this.bs>1){
            if(!this.checkBounds(id))return false;
        }
        let e=this.elem[id];
        for(let i=0;i<e.length;i++){
            let b0=this.boundaryID[e[i]];
            let b1=this.boundaryID[e[(i+1)%3]];
            if(b0-b1===0){
                let v0=this.boundary[e[(i+1)%3]];
                if(v0===e[i]){
                    return false;
                }
            }
        }
        return true;
    }

    isBoundary(nodeId0,nodeId1){
        let p=this.boundary[nodeId0];
        if(p===nodeId1)return true;
        p=this.boundary[nodeId1];
        if(p===nodeId0){
            return true;
        }else{
            return false;
        }
    }

    edge(elemId,targetId,mp){
        let j=mp[elemId];
        for(let i=0;i<j.length;i++){
            if(j[i]===targetId)return i;
        }
        return -1;
    }

    isSwap(aId,bId,cId,pId){
        let x13=this.node[aId].x-this.node[cId].x;
        let y13=this.node[aId].y-this.node[cId].y;
        let x23=this.node[bId].x-this.node[cId].x;
        let y23=this.node[bId].y-this.node[cId].y;
        let x1p=this.node[aId].x-this.node[pId].x;
        let y1p=this.node[aId].y-this.node[pId].y;
        let x2p=this.node[bId].x-this.node[pId].x;
        let y2p=this.node[bId].y-this.node[pId].y;
        let cosa=x13*x23+y13*y23;
        let cosb=x2p*x1p+y1p*y2p;
        if(cosa>=0&&cosb>=0){
            return false;
        }else if(cosa<0&&cosb<0){
            return true;
        }else{
            let sina=x13*y23-x23*y13;
            let sinb=x2p*y1p-x1p*y2p;
            if((sina*cosb+sinb*cosa)<0){
                return true;
            }else{
                return false;
            }
        }
    }

    normalize(x,y,z){
        let xx=(x-this.minX)/this.width;
        let yy=(y-this.minY)/this.height;
        return {x:xx,y:yy,z:z};
    }

    checkBounds(id){
        let e=this.elem[id];
        if(e[0]<3||e[1]<3||e[2]<3){
            return false;
        }else{
            return true;
        }
    }

    insert(pos){
        let p=this.normalize(pos.x,pos.y,pos.z);
        this.ids=this.getLocation(this.ids,p);
        if(this.ids===-1){
            this.ids=0;
            return false;
        }else{
            if(this.checkBoundaryState(this.ids)){
                this.data.push(pos);
                this.node.push(p);
                this.process(this.ids,this.node.length-1);
                return true;
            }else{
                return false;
            }
        }
    }

    addBoundary(arg,isClose){
        let sz=this.node.length;
        for(let i=0;i<arg.length;i++){
            let p=this.normalize(arg[i].x,arg[i].y);
            this.ids=this.getLocation(this.ids,p);
            if(this.ids===-1){
                this.ids=0;
                continue;
            }
            if(this.checkBoundaryState(this.ids)){
                this.data.push(arg[i]);
                this.node.push(p);
                if(i>0){
                    this.boundary[sz+i-1]=sz+i;
                    this.boundaryID[sz+i-1]=this.bs;
                }
                this.process(this.ids,this.node.length-1);
            }
        }
        if(isClose){
            this.boundary[this.node.length-1]=sz;
            this.boundaryID[this.node.length-1]=this.bs;
        }
        this.bs++;
    }

    process(elemId,nodeId){
        let nn=this.elem.length;
        let em=this.elem[elemId];
        let te=new Array(em[0],em[1],em[2]);
        let e0=new Array(nodeId,em[0],em[1]);
        let e1=new Array(nodeId,em[1],em[2]);
        let e2=new Array(nodeId,em[2],em[0]);
        em[0]=e0[0];em[1]=e0[1];em[2]=e0[2];
        this.elem.push(e1);
        this.elem.push(e2);
        let jm=this.map[elemId];
        let tmp=new Array(jm[0],jm[1],jm[2]);
        let j0=new Array(nn+1,jm[0],nn);
        let j1=new Array(elemId,jm[1],nn+1);
        let j2=new Array(nn,jm[2],elemId);
        jm[0]=j0[0];jm[1]=j0[1];jm[2]=j0[2];
        this.map.push(j1);
        this.map.push(j2);
        if(tmp[0]!=-1){
            if(!this.isBoundary(te[0],te[1]))this.stack.push(elemId);
        }
        if(tmp[1]!=-1){
            var ix=this.edge(tmp[1],elemId,this.map);
            this.map[tmp[1]][ix]=nn;
            if(!this.isBoundary(te[1],te[2]))this.stack.push(nn);
        }
        if(tmp[2]!=-1){
            var ix=this.edge(tmp[2],elemId,this.map);
            this.map[tmp[2]][ix]=nn+1;
            if(!this.isBoundary(te[2],te[0]))this.stack.push(nn+1);
        }
        while(this.stack.length>0){
            let il=this.stack.pop();
            let ir=this.map[il][1];
            let ierl=this.edge(ir,il,this.map);
            let iera=(ierl+1)%3;
            let ierb=(iera+1)%3;
            let iv1=this.elem[ir][ierl];
            let iv2=this.elem[ir][iera];
            let iv3=this.elem[ir][ierb];
            if(this.isSwap(iv1,iv2,iv3,nodeId)){
                let ja=this.map[ir][iera];
                let jb=this.map[ir][ierb];
                let jc=this.map[il][2];
                this.elem[il][2]=iv3;
                this.map[il][1]=ja;
                this.map[il][2]=ir;
                let picElem=this.elem[ir];
                picElem[0]=nodeId;picElem[1]=iv3;picElem[2]=iv1;
                picElem=this.map[ir];
                picElem[0]=il;picElem[1]=jb;picElem[2]=jc;
                if(ja!==-1){
                    let ix=this.edge(ja,ir,this.map);
                    this.map[ja][ix]=il;
                    if(!this.isBoundary(iv2,iv3))this.stack.push(il);
                }
                if(jb!==-1){
                    if(!this.isBoundary(iv3,iv1))this.stack.push(ir);
                }
                if(jc!==-1){
                    let ix=this.edge(jc,il,this.map);
                    this.map[jc][ix]=ir;
                }
            }
        }
    }

    getMeshObject(){
        let ret=new MeshObject(
            this.data,
            this.node,
            this.elem,
            this.neigh,
            this.boundary);
        return ret;
    }
}

class MeshObject{

    constructor(data,node,elem,neigh,boundary){
        this.data=data;
        this.node=node;
        this.elem=elem;
        this.neigh=neigh;
        this.boundary=boundary;
        this.EPS=1e-12;
        this.range={};
        this.values=[];
        this.points=[];
    }

    setValues(val){
        this.values=val;
        let max=-1e18;
		let min=1e18;
		for(let i=0;i<this.values.length;i++){
			max=Math.max(max,this.values[i]);
			min=Math.min(min,this.values[i]);
		}
        this.range={"min":min,"max":max};
    }

    getRange(){
        return this.range;
    }

    getTriArea(id){
		let a=this.data[this.elem[id][0]-3][0]*this.data[this.elem[id][1]-3][1];
		let b=this.data[this.elem[id][1]-3][0]*this.data[this.elem[id][2]-3][1];
		let c=this.data[this.elem[id][2]-3][0]*this.data[this.elem[id][0]-3][1];
		let d=this.data[this.elem[id][0]-3][0]*this.data[this.elem[id][2]-3][1];
		let e=this.data[this.elem[id][1]-3][0]*this.data[this.elem[id][0]-3][1];
		let f=this.data[this.elem[id][2]-3][0]*this.data[this.elem[id][1]-3][1];
		return 0.5*(a+b+c-d-e-f);
    }
    
    getTriAreas(){
		let ret=[];
		for(var i=0;i<this.elem.length;i++){
			ret.push(this.getTriArea(i));
		}
		return ret;
    }
    
    getNolmData(){
		let rg=this.range.max-this.range.min;
		let ret=[];
		for(var i=0;i<this.values.length;i++){
			ret.push((this.values[i]-this.range.min)/rg);
		}
		return ret;
    }
    
    /** 頂点角度 */
    calTheta(elemId,vertId){
		let x0=this.data[this.elem[elemId][vertId]-3][0];
		let y0=this.data[this.elem[elemId][vertId]-3][1];
		let x1=this.data[this.elem[elemId][(vertId+2)%3]-3][0];
		let y1=this.data[this.elem[elemId][(vertId+2)%3]-3][1];
		let x2=this.data[this.elem[elemId][(vertId+1)%3]-3][0];
		let y2=this.data[this.elem[elemId][(vertId+1)%3]-3][0];
		let xa=x1-x0;
		let ya=y1-y0;
		let xb=x2-x0;
		let yb=y2-y0;
		let prdin=xa*xb+ya*ya;
		let prdex=xa*yb-xb*ya;
		let theta=0;
		if(Math.abs(prdin)<EPS){
			theta=Math.PI/2.0;
		}else{
			theta=Math.tan(prdex/prdin);
			if(theta<0){
				theta +=Math.PI;
			}else if(theta>Math.PI){
				theta -=Math.PI;
			}
		}
		return theta;
    }
    
    getTheta(elemId){
		let ret=[];
		for(let i=0;i<3;i++){
			ret.push(this.calTheta(elemId,i));
		}
		return ret;
    }
    
    getThetas(){
		let ret=[];
		for(var i=0;i<this.elem.length;i++){
			ret.push(this.getTheta(i));
		}
		return ret;
    }
    
    calEdgeLength(elemId,vertId){
		let x0=this.data[this.elem[elemId][vertId]-3][0];
		let y0=this.data[this.elem[elemId][vertId]-3][1];
		let x1=this.data[this.elem[elemId][(vertId+1)%3]-3][0];
		let y1=this.data[this.elem[elemId][(vertId+1)%3]-3][0];
		let xx=(x1-x0)*(x1-x0);
		let yy=(y1-y0)*(y1-y0);
		return Math.sqrt(xx+yy);
	}
	
	getEdgeLength(elemId){
		let ret=[];
		for(let i=0;i<3;i++){
			ret.push(this.calEdgeLength(elemId,i));
		}
		return ret;
	}
	
	getEdgeLengths(){
        let ret=[];
		for(let i=0;i<this.elem.length;i++){
			ret.push(this.getEdgeLength(i));
		}
		return ret;
    }
    
    getTriCenter(elemId){
		let x0=this.data[this.elem[elemId][0]-3][0];
		let y0=this.data[this.elem[elemId][0]-3][1];
		let x1=this.data[this.elem[elemId][1]-3][0];
		let y1=this.data[this.elem[elemId][1]-3][1];
		let x2=this.data[this.elem[elemId][2]-3][0];
		let y2=this.data[this.elem[elemId][2]-3][0];
		let xx=(x0+x1+x2)/3;
		let yy=(y0+y1+y2)/3;
		return {"x":xx,"y":yy};
    }
    
    getBounds(){
        let minx=1e18;
        let miny=1e18;
        let maxx=-1e18;
        let maxy=-1e18;
        for(let i=0;i<this.node.length;i++){
            minx=Math.min(minx,node[0]);
            miny=Math.min(miny,node[1]);
            maxx=Math.max(mqxx,node[0]);
            maxy=Math.max(maxy,node[1]);
        }
        return {"x":minx,"y":miny,"width":maxx-minx,"height":maxy-miny};
    }

    init(){
        this.points=[];
        for(var i=0;i<this.data.length;i++){
            let x=this.data[i].x;
            let y=this.data[i].y;
            let p=new Point(x,y,this.values[i]);
            this.points.push(p);
        }
    }


    sort(it,pos){
        for(var i=1;i<it.length;i++){
            if(pos[it[i]].val<pos[it[i-1]].val){
                var t=it[i-1];
                it[i-1]=it[i];
                it[i]=t;
                return this.sort(it,pos);
            }
        }
        return  [pos[it[0]],pos[it[1]],pos[it[2]]];
    }

    getPoint(pos_small,pos_large,val){
        if(pos_small.val==pos_large.val)return null;
        let rr=(val-pos_small.val)/(pos_large.val-pos_small.val);
        let x=pos_small.x;
        let y=pos_small.y;		
        let xx=(pos_large.x-x)*rr+x;
        let yy=(pos_large.y-y)*rr+y;
        return new Point(xx,yy,val);
    }

    getContourArray(val){
        let ret=[];
        for(var i=0;i<this.elem.length;i++){
            if(this.elem[i][0]<3||this.elem[i][1]<3||this.elem[i][2]<3)continue;
            let nd=[this.points[this.elem[i][0]-3],this.points[this.elem[i][1]-3],this.points[this.elem[i][2]-3]];
            var line=this.getContour(nd,val);
            if(line!=null)ret.push(line);
        }
        return ret;
    }

    getContour(p,val){
        p.sort(function(a,b){
            if(a.val>b.val){
                return 1;
            }else if(a.val<b.val){
                return -1;
            }else{
                return 0;
            }
        });
        if(val>=p[0].val){
            if(val>p[2].val){
                return null;
            }else{
                if(val>=p[1].val){
                    let a=this.getPoint(p[0],p[2],val);
                    let b=this.getPoint(p[1],p[2],val);
                    if(a==null||b==null||(a.x==b.x&&a.y==b.y))return null;
                    return [[a.x,a.y],[b.x,b.y]];
                }else{
                    let a=this.getPoint(p[0],p[2],val);
                    let b=this.getPoint(p[0],p[1],val);
                    if(a==null||b==null||(a.x==b.x&&a.y==b.y))return null;
                    return [[a.x,a.y],[b.x,b.y]];	
                }
            }
        }else{
            return null;
        }
    }

    getTriangles(){
        let ret=[];
        for(let i=0;i<this.elem.length;i++){
            let p1=this.data[this.elem[i][0]-3];
            let p2=this.data[this.elem[i][1]-3];
            let p3=this.data[this.elem[i][2]-3];
            if(p1&&p2&&p3)ret.push([p1,p2,p3]);
        }
        return ret;
    }
}

class Point{
    constructor(px,py,v){
        this.x=px;
        this.y=py;
        this.val=v;
    }
}

function jointLine(lines,keta){
    for(let i=0;i<lines.length;i++){
        lines[i][0][0]=Number(lines[i][0][0].toFixed(keta));
        lines[i][0][1]=Number(lines[i][0][1].toFixed(keta));
        lines[i][1][0]=Number(lines[i][1][0].toFixed(keta));
        lines[i][1][1]=Number(lines[i][1][1].toFixed(keta));
    }
    ret=[];
    while(lines.length>0){
        let ll=lines.shift();
        let sx=ll[0][0];
        let sy=ll[0][1];
        let ex=ll[1][0];
        let ey=ll[1][1];
        let flg=true;
        for(let i=0;i<ret.length;i++){
            let mm=ret[i];
            let sx2=mm[0][0];
            let sy2=mm[1][1];
            let ex2=mm[mm.length-1][0];
            let ey2=mm[mm.length-1][1];
            if(sx==sx2&&sy==sy2){
                mm.unshift([ex,ey]);
                flg=false;
                break;
            }else if(ex==sx2&&ey==sy2){
                mm.unshift([sx,sy]);
                flg=false;
                break;
            }else if(sx==ex2&&sy==ey2){
                mm.push([ex,ey]);
                flg=false;
                break;
            }else if(ex==ex2&&ey==ey2){
                mm.push([sx,sy]);
                flg=false;
                break;
            }
        }
        if(flg)ret.push(ll);
    }
    return ret;
}