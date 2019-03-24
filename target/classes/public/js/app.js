const dataLabel=["さくら満開"];
const cyberJ = new ol.layer.Tile({
    source: new ol.source.XYZ({
        attributions: [ new ol.Attribution({ html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>" }) ],
        url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
        projection: "EPSG:3857"
    })
});
let map;
let vectorSource;
let vectorLayer;
let style_1 = new ol.style.Style({
	fill : new ol.style.Fill({
    	color : 'blue',
    	opacity : 0.6,
	}),
	stroke : new ol.style.Stroke({
    	width : 2,
    	color : 'blue',
    	radius : 1
	})
});
const circle_dist=10000;
let controller;
let interval;
let chart=null;

$(document).ready(function(){
	init();
	$("#dataRange").on("input",function() {
		$("#dataRange").change();
	});

	$("#dataRange").change(function() {
			let val=$("#dataRange").val();
			let date=getDayOfYearStr(val);
			$("#dateStr").text(formatDate(date));
			controller.update(val);
	});
	$("#mesh_check").change(function() {
		controller.drawMesh();
	});
	$("#dialog").draggable({handle: ".modal-header"});
	$("#dialog").modal({'show':true,'backdrop':false});
	getData();
});

function getDayOfYearStr(dayOfYear) {
	let tmp=new Date(new Date().getFullYear(), 0, 1).getTime();
	return new Date(tmp+dayOfYear*86400000);
 };

 function formatDate(date) {
  let format = 'MM月DD日';
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
  return format;
};

function init(){
	map = new ol.Map({
		layers: [cyberJ],
		loadTilesWhileAnimating: true,
		target: 'map',
		view: new ol.View({
	        minZoom: 5,
	        maxZoom: 7,
			center: ol.proj.fromLonLat([138, 38]),
			zoom: 6,
			extent: ol.proj.transformExtent([128,28,138,43], 'EPSG:4326', 'EPSG:3857')
		}),
		controls: ol.control.defaults({
			zoom: false,
			attribution: false,
			rotate: false
		}),
	});

	let observationPoint = new ol.interaction.Select();
	observationPoint.on('select', function(e) {
		if(!("get" in e.selected[0]))return;
		let name=e.selected[0].get("name");
		if(!name)return;
		let dd=controller.getPointData(name);
		let mes=$("#spaceies").text();
		$("#outputDialog").modal({'show':true});
		let ctx = document.getElementById("chart");
		if(chart!=null)chart.destroy();
		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: dd.label,
				datasets: [
					{
						data: dd.data,
						backgroundColor: "orange"
					}
				],
			},
			options: {
				title: {
					display: true,
					text: mes+" : "+name+" (1月1日から発生までの日数)"
				},
				legend: {
					display: false
			 },
			 scales: {
				yAxes: [
						{
							ticks: {
//								beginAtZero: true,
							}
						}
					]
				}		
			}
		});
	});
	map.addInteraction(observationPoint);

	vectorSource = new ol.source.Vector({
		projection: "EPSG:3857",
		features: []
	});

	vectorLayer = new ol.layer.Vector({
		source : vectorSource,
		style : style_1
	});
	vectorLayer.setZIndex(5);
	map.renderSync();
	map.addLayer(vectorLayer);
}

function getData(){
	if(controller)controller.clear();
	let mes=$("#spaceies").text();
	let mes2=$("#datatype").text();
	let arg="";
	if(mes2=="5年移動平均"){
		arg="&ave5=true";
	}
	$.ajax({
		url: "/data/spaceies="+mes+arg,
		type: "GET",
		timeout: 10000,
	}).done(function(data, status, xhr) {
		controller=new Controller(data.data,data.year,data.point);
		let str=$("#data_year").text();
			if(str=="経年比較"){
			controller.loadData([1955,1965,1975,1985,1995,2005,2015]);
		}else{
			str=str.substring(0,str.length-1);
			controller.loadData([Number(str)]);
		}
	}).fail(function(xhr, status, error) {
	    console.log("fail");
	});
}

function SpaceiesSelect(str){
	$("#spaceies").text(str);
	getData();
}

function DataTypeSelect(str){
	$("#datatype").text(str);
	getData();
}

function createMesh(list){
	let minx=1e18;
	let maxx=-1e18;
	let miny=1e18;
	let maxy=-1e18;
	let val=[];
	let pos=[];
	for(let i=0;i<list.length;i++){
		var p={"x":list[i].lng,"y":list[i].lat};
		minx=Math.min(minx,p.x);
		maxx=Math.max(maxx,p.x);
		miny=Math.min(miny,p.y);
		maxy=Math.max(maxy,p.y);
		pos.push(p);
		val.push(getDayOfYear(new Date(list[i].date)));
	}
	let del=new Delaunay({"minx":minx,"miny":miny,"width":maxx-minx,"height":maxy-miny});
	for(let i=0;i<pos.length;i++){
		del.insert(pos[i]);
	}
	var mesh=del.getMeshObject();
	mesh.setValues(val);
	mesh.init();
	return new Mesh(mesh);
};

function getDayOfYear(date) {
	var onejan = new Date(date.getFullYear(), 0, 1);
	return Math.ceil((date - onejan) / 86400000);
 };

class Mesh{
	constructor(mesh){
		this.mesh=mesh;
		this.range=this.mesh.getRange();
	}

	getRange(){
		return this.range;
	}

	getContours(vals,keta){
		let ret=[];
		for(let i=0;i<vals.length;i++){
			let v=getContour(vals[i],keta);
			ret.push(v);
		}
		return ret;
	}

	getContour(val,keta){
		let lines=this.mesh.getContourArray(val);
		if(lines.length<=0)return lines;
		lines=jointLine(lines,keta);
		return lines;
	}

	getMeshStyle(){
		return new ol.style.Style({
			stroke : new ol.style.Stroke({
				width : 1,
				color : 'gray'
			})
		});
	}

	createMultiLine(val,keta,year){
		let line=this.getContour(val,keta);
		let ret=[];
		for(let i=0;i<line.length;i++){
			let tmp={
				'type': 'Feature',
				'geometry': {
				  'type': 'MultiLineString',
				  'coordinates': [line[i]]
				}
			};
			if(i==line.length-1){
				tmp.properties={'year':year};
			}
			ret.push(tmp);
		}
		let geojson={
			'type': 'FeatureCollection',
			'crs': {
			  'type': 'name',
			  'properties': {
				'name': 'EPSG:4326',
			  }
			},
			'features':ret
		};
		return geojson;
	}

	getMeshGeoJson(){
		let tri=this.mesh.getTriangles();
		let features=[];
		for(let i=0;i<tri.length;i++){
			features.push(this.createPolygon(tri[i]));
		}
		let geojson={
			'type': 'FeatureCollection',
			'crs': {
			  'type': 'name',
			  'properties': {
				'name': 'EPSG:4326'
			  }
			},
			'features':features
		};
		return geojson;
	}

	createPolygon(tri){
		let ret={
			'type': 'Feature',
			'geometry': {
			  'type': 'Polygon',
			  'coordinates': [[[tri[0].x, tri[0].y], [tri[1].x, tri[1].y], [tri[2].x, tri[2].y], [tri[0].x, tri[0].y]]]
			}
		};
		return ret;
	}
}

class Controller{
	constructor(data,year,point){
		this.data=data;
		this.year=year;
		this.point=point;
		this.drawPoint(this.point);
		this.meshLayer=null;
		this.flg=false;
		this.meshs=[];
		this.layers=[];
		this.dataYear=[];
		this.minv=1e18;
		this.maxv=-1e18;
		this.init();
	}

	clear(){
		if(this.meshLayer!=null)map.removeLayer(this.meshLayer);
		this.layers.forEach(function(ll){
			map.removeLayer(ll);
		});
	}

	init(){
		$("#data_year_list").empty();
		for(let i=0;i<this.year.length;i++){
			let bt=$("<a>");
			bt.attr("class","dropdown-item");
			bt.attr("href","#");
			bt.attr("onclick","changeData('"+this.year[i]+"')");
			bt.text(this.year[i]+"年");
			$("#data_year_list").append(bt);
		}
	}

	drawPoint(list){
		vectorSource.clear();
		list.forEach(function(p){
			let coord=ol.proj.fromLonLat([p.lng,p.lat]);
			vectorSource.addFeature(new ol.Feature({geometry:new ol.geom.Circle(coord, circle_dist),name:p.name}));
		});
	}

	drawMesh(){
		if(!this.flg){
			let mesh=createMesh(this.point);
			let meshVector = new ol.source.Vector();
			meshVector.addFeatures(new ol.format.GeoJSON().readFeatures(mesh.getMeshGeoJson(),{'featureProjection':'EPSG:3857'}));
			this.meshLayer = new ol.layer.Vector({
				source: meshVector,
				style: mesh.getMeshStyle()
			});
			map.addLayer(this.meshLayer);
		}else{
			map.removeLayer(this.meshLayer);
			this.meshlayer=null;
		}
		this.flg=!this.flg;
	}

	loadData(years){
		this.layers.forEach(function(ll){
			map.removeLayer(ll);
		});
		this.meshs=[];
		this.layers=[];
		this.dataYear=[];
		this.minv=1e18;
		this.maxv=-1e18;
		for(let i=0;i<years.length;i++){
			let tmp=createMesh(this.data[years[i]]);
			this.meshs.push(tmp);
			let r=tmp.getRange();
			this.minv=Math.min(this.minv,r.min);
			this.maxv=Math.max(this.maxv,r.max);
			let lineVector = new ol.source.Vector();
			lineVector.addFeatures(new ol.format.GeoJSON().readFeatures(tmp.createMultiLine(0,3,years[i]),{'featureProjection':'EPSG:3857'}));
			let lineStyle=createLineStyle(i,years.length);
			var lineLayer = new ol.layer.Vector({
				source: lineVector,
				style: lineStyle
			});
			map.addLayer(lineLayer);
			this.layers.push(lineLayer);
			this.dataYear.push(years[i]);
		}
		$("#dataRange").attr("min",this.minv);
		$("#dataRange").attr("max",this.maxv);
		$("#dataRange").val(this.minv).change();
		map.render();
	}

	update(date){
		for(let i=0;i<this.meshs.length;i++){
			let lineVector = new ol.source.Vector();
			lineVector.addFeatures(new ol.format.GeoJSON().readFeatures(this.meshs[i].createMultiLine(date,3,this.dataYear[i]),{'featureProjection':'EPSG:3857'}));
			this.layers[i].setSource(lineVector);
		}
		map.render();
	}

	startAnime(){
		if(interval!=null){
			clearInterval(interval);
			interval=null;
		}else{
			let text=$('#speed').text();
			let sp=100;
			if(text=="再生速度：速い"){
				sp=50;
			}else if(text=="再生速度：遅い"){
				sp=200;
			}
			var imageUpdate=function(){
				let max=$("#dataRange").attr("max");
				let val=Number($("#dataRange").val());
				val +=1;
				$("#dataRange").val(val).change();
				if(val>max){
					clearInterval(interval);
					interval=null;
				}
			};
			interval=setInterval(imageUpdate,sp);
		}
	}

	getPointData(name){
		let lab=[];
		let val=[];
		for(let i=0;i<this.year.length;i++){
				let dd=this.data[this.year[i]];
				for(let j=0;j<dd.length;j++){
					if(dd[j].pointName==name){
						lab.push(this.year[i]);
						val.push(getDayOfYear(new Date(dd[j].date)));
						break;
					}
				}
		}
		return {label:lab,data:val};
	}
}

function getText(feature) {
	var text = feature.get("year");
	if(!text){
		return "";
	}else{
		return String(text);
	}
};

function createLineStyle(id,num){
	if(num==1){
		return style_line[style_line.length-1];
	}else{
		return style_line[id];
	}
}

function lineStyle_1(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : '#cc0000ff',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}
function createTextStyle(feature){
	return new ol.style.Text({
		textAlign: "left",
		textBaseline: "middle",
		font: "Arial",
		text: getText(feature),
		scale :1.6,
		size:"16px",
		fill: new ol.style.Fill({color: "#ff0000"}),
		stroke: new ol.style.Stroke({color: "#ffffff", width: 3}),
	});
}

function changeData(str){
	if(str=="経年比較"){
		$("#data_year").text(str);
		controller.loadData([1955,1965,1975,1985,1995,2005,2015]);
	}else{
		$("#data_year").text(str+"年");
		controller.loadData([Number(str)]);
	}
}

let style_line=[lineStyle_1,lineStyle_2,lineStyle_3,lineStyle_4,lineStyle_5,lineStyle_6,lineStyle_7];

function lineStyle_1(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : 'rgb(251,222,204)',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}

function lineStyle_2(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : 'rgb(254,204,203)',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}

function lineStyle_3(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : 'rgb(255,152,153)',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}

function lineStyle_4(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : 'rgb(255,107,107)',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}

function lineStyle_5(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : 'rgb(255,54,54)',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}

function lineStyle_6(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : 'rgb(254,0,0)',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}

function lineStyle_7(feature){
	return new ol.style.Style({
		stroke: new ol.style.Stroke(({
			width: 6,
			color : 'rgb(204,0,0)',
			radius : 1
		})),
		text:createTextStyle(feature)
	});
}
