package net.termat.phenologicalmap.data;

import java.util.Date;

import com.j256.ormlite.field.DatabaseField;

public class PhenologicalData {

	@DatabaseField(generatedId=true)
    public Long id;

	@DatabaseField
	public String pointName;

	@DatabaseField
	public int pointId;

	@DatabaseField
	public String spaceies;

	@DatabaseField
	public int year;

	@DatabaseField
	public Date date;

	@DatabaseField
	public int remark;

	@DatabaseField
	public double lat;

	@DatabaseField
	public double lng;
}
