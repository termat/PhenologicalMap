package net.termat.spark;

import static spark.Spark.get;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;

import net.termat.phenologicalmap.data.PhenologicalDB;
import net.termat.phenologicalmap.data.PhenologicalData;
import spark.ModelAndView;
import spark.Spark;
import spark.template.mustache.MustacheTemplateEngine;

public class Main {

	public static void main(String[] args) {
		Spark.staticFileLocation("/public");
		port(getHerokuAssignedPort());
		Gson gson=new Gson();
		String path=System.getProperty("user.dir");
		PhenologicalDB db=new PhenologicalDB();
		try{
			db.connectDB(path+"/PhenologicalDB.db");
		}catch(Exception e){}

        get("/", (request, response) -> {
            Map<String, Object> model = new HashMap<>();
            return new ModelAndView(model, "index.mustache");
        }, new MustacheTemplateEngine());

        get("/data/:param", (request, response) -> {
        	try{
        		Map<String,String> map=paramMap(request.params("param"));
				String spaceies=map.get("spaceies");
				Map<String,Object> ret=new HashMap<String,Object>();
				List<PhenologicalData> data=db.getPhenologicalDataAll(spaceies);
				List<Object> points=db.getObservationPoint(data);
				Integer[] years=db.getYears(data);
				if(map.containsKey("ave5")){
					Integer[] ny=new Integer[years.length-4];
					for(int i=0;i<ny.length;i++){
						ny[i]=years[i+2];
					}
					data=db.processPhenologicalListAve5(data);
					Map<Integer,List<PhenologicalData>> obj=db.processPhenologicalList(data,ny);
					ret.put("data", obj);
					ret.put("point", points);
					ret.put("year", ny);
				}else{
					Map<Integer,List<PhenologicalData>> obj=db.processPhenologicalList(data,years);
					ret.put("data", obj);
					ret.put("point", points);
					ret.put("year", years);
				}
                response.type("application/json");
                response.status(200);
                return gson.toJson(ret);
        	}catch(Exception e){
        		e.printStackTrace();
        		response.status(404);
                return gson.toJson(new int[0]);
         	}
        });
	}

	private static Map<String,String> paramMap(String param) throws Exception{
    	Map<String,String> ret=new HashMap<String,String>();
    	String[] p=param.split("&");
    	for(int i=0;i<p.length;i++){
    		String[] k=p[i].split("=");
    		if(k.length<2)continue;
    		ret.put(k[0], k[1]);
    	}
    	return ret;
	}
	
	static int getHerokuAssignedPort() {
        ProcessBuilder processBuilder = new ProcessBuilder();
        if (processBuilder.environment().get("PORT") != null) {
            return Integer.parseInt(processBuilder.environment().get("PORT"));
        }
        return 4567;
    }
}
