package net.termat.phenologicalmap.data;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;

import com.j256.ormlite.dao.Dao;
import com.j256.ormlite.dao.DaoManager;
import com.j256.ormlite.jdbc.JdbcConnectionSource;
import com.j256.ormlite.misc.TransactionManager;
import com.j256.ormlite.stmt.QueryBuilder;
import com.j256.ormlite.support.ConnectionSource;
import com.j256.ormlite.table.TableUtils;

public class PhenologicalDB {
	private ConnectionSource connectionSource = null;
	private Dao<PhenologicalData,Long> phDao;
	private Calendar cal=Calendar.getInstance();

	public void connectDB(String name) throws SQLException{
		try{
			if(!name.endsWith(".db"))name=name+".db";
			Class.forName("org.sqlite.JDBC");
			connectionSource = new JdbcConnectionSource("jdbc:sqlite:"+name);
			phDao= DaoManager.createDao(connectionSource, PhenologicalData.class);
			TableUtils.createTableIfNotExists(connectionSource, PhenologicalData.class);
		}catch(SQLException e){
			e.printStackTrace();
			throw e;
		}catch(Exception e){
			e.printStackTrace();
		}
	}

	public void addData(PhenologicalData d)throws Exception{
		phDao.createIfNotExists(d);
	}

	public void addData(List<PhenologicalData> list)throws Exception{
		TransactionManager.callInTransaction(phDao.getConnectionSource(), new Callable<Void>(){
			public Void call() throws Exception {
				for(PhenologicalData fp : list){
					phDao.create(fp);
				}
				return null;
			}
		});
	}

	public List<PhenologicalData> getPhenologicalDataAtYear(String spaceies,int year)throws Exception{
		QueryBuilder<PhenologicalData,Long> query=phDao.queryBuilder();
		query.orderBy("pointId", false).where().eq("spaceies", spaceies).and().eq("year", year);
		return phDao.query(query.prepare());
	}

	public List<PhenologicalData> getPhenologicalDataAll(String spaceies)throws Exception{
		QueryBuilder<PhenologicalData,Long> query=phDao.queryBuilder();
		query.orderBy("pointId", false).where().eq("spaceies", spaceies);
		return phDao.query(query.prepare());
	}

	public List<Object> getObservationPoint(List<PhenologicalData> list) throws Exception{
		List<Object> tmp=new ArrayList<Object>();
		Set<String> ck=new HashSet<String>();
		for(PhenologicalData p : list){
			if(ck.contains(p.pointName))continue;
			ck.add(p.pointName);
			ObPoint op=new ObPoint(p.pointName,p.lat,p.lng);
			tmp.add(op);
		}
		return tmp;
	}

	public Integer[] getYears(List<PhenologicalData> list)throws Exception{
		Set<Integer> years=new HashSet<Integer>();
		for(PhenologicalData p : list){
			years.add(p.year);
		}
		Integer[] ret=years.toArray(new Integer[years.size()]);
		Arrays.sort(ret);
		return ret;
	}

	public Map<Integer,List<PhenologicalData>> processPhenologicalList(List<PhenologicalData> list,Integer[] year)throws Exception{
		Map<Integer,List<PhenologicalData>> ret=new HashMap<Integer,List<PhenologicalData>>();
		for(int i=0;i<year.length;i++){
			ret.put(year[i],new ArrayList<PhenologicalData>());
		}
		for(PhenologicalData p : list){
			ret.get(p.year).add(p);
		}
		return ret;
	}

	public List<PhenologicalData> processPhenologicalListAve5(List<PhenologicalData> sor)throws Exception{
		int n=sor.size();
		List<PhenologicalData> ret=new ArrayList<PhenologicalData>();
		List<PhenologicalData> tmp=new ArrayList<PhenologicalData>();
		int id=-1;
		for(int i=0;i<n;i++){
			PhenologicalData pd=sor.get(i);
			if(pd.pointId!=id){
				id=pd.pointId;
				if(tmp.size()>0){
					ret.addAll(average5(tmp));
					tmp.clear();
					tmp.add(pd);
				}
			}else{
				tmp.add(pd);
			}
		}
		if(tmp.size()>0)ret.addAll(average5(tmp));
		return ret;
	}

	private List<PhenologicalData> average5(List<PhenologicalData> list){
		List<PhenologicalData> ret=new ArrayList<PhenologicalData>();
		int n=list.size();
		for(int i=2;i<n-2;i++){
			PhenologicalData t=list.get(i);
			PhenologicalData p=new PhenologicalData();
			p.lat=t.lat;
			p.lng=t.lng;
			p.pointId=t.pointId;
			p.pointName=t.pointName;
			p.spaceies=t.spaceies;
			p.year=t.year;
			long d1=dateOfYear(t.date);
			long d2=dateOfYear(list.get(i-1).date);
			long d3=dateOfYear(list.get(i+1).date);
			long d4=dateOfYear(list.get(i-2).date);
			long d5=dateOfYear(list.get(i+2).date);
			p.date=setdateOnYear(t.date,(d1+d2+d3+d4+d5)/5);
			ret.add(p);
		}
		return ret;
	}

	private Date setdateOnYear(Date d,long v){
		cal.setTime(d);
		cal.set(Calendar.MONTH, 0);
		cal.set(Calendar.DATE, 1);
		long ret=cal.getTimeInMillis()+v*60*60*24*1000;
		return new Date(ret);
	}

	private long dateOfYear(Date d){
		cal.setTime(d);
		long val=cal.getTimeInMillis();
		cal.set(Calendar.MONTH, 0);
		cal.set(Calendar.DATE, 1);
		long tmp=cal.getTimeInMillis();
		long dur=(val-tmp)/(60*60*24*1000);
		return dur;
	}


	private class ObPoint{
		public String name;
		public double lat;
		public double lng;
		public ObPoint(String n,double la,double ln){
			this.name=n;
			this.lat=la;
			this.lng=ln;
		}
		public String toString(){
			return name;
		}
	}
}
