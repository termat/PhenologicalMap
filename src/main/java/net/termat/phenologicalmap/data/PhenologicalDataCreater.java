package net.termat.phenologicalmap.data;

import java.awt.BorderLayout;
import java.awt.Font;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.dnd.DnDConstants;
import java.awt.dnd.DropTarget;
import java.awt.dnd.DropTargetAdapter;
import java.awt.dnd.DropTargetDragEvent;
import java.awt.dnd.DropTargetDropEvent;
import java.awt.dnd.DropTargetListener;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.WindowConstants;

public class PhenologicalDataCreater {
	private final String REG = "\"([^\"\\\\]*(\\\\.[^\"\\\\]*)*)\"|([^,]+)|,|";
	private Pattern pattern = Pattern.compile(REG);
	private JFrame frame;
	private Calendar cal=Calendar.getInstance();
	private PhenologicalDB db;
	private Map<String,MPoint> map;

	public PhenologicalDataCreater(){
		frame=new JFrame();
		try {
			frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
			UIManager.setLookAndFeel("com.sun.java.swing.plaf.nimbus.NimbusLookAndFeel");
			SwingUtilities.updateComponentTreeUI(frame);
			frame.pack();
		}catch(Exception e){
			try {
				UIManager.setLookAndFeel("com.sun.java.swing.plaf.windows.WindowsLookAndFeel");
				SwingUtilities.updateComponentTreeUI(frame);
				frame.pack();
			}catch(Exception ee){
				ee.printStackTrace();
			}
		}
		frame.getContentPane().setLayout(new BorderLayout());
		frame.setDefaultCloseOperation(WindowConstants.DO_NOTHING_ON_CLOSE);
		frame.addWindowListener(new WindowAdapter(){
			@Override
			public void windowClosing(WindowEvent e) {
				exit();
			}
		});
		JLabel label=new JLabel("CsvFromPdfText");
		Font font=new Font(Font.DIALOG,Font.BOLD,24);
		label.setFont(font);
		label.setVerticalAlignment(JLabel.CENTER);
		label.setHorizontalAlignment(JLabel.CENTER);
		frame.getContentPane().setLayout(new BorderLayout());
		frame.add(label,BorderLayout.CENTER);
		frame.setTitle("CsvFromPdfText");
		DropTargetListener dtl = new DropTargetAdapter() {
			@Override
			public void dragOver(DropTargetDragEvent dtde) {
				if (dtde.isDataFlavorSupported(DataFlavor.javaFileListFlavor)) {
					dtde.acceptDrag(DnDConstants.ACTION_COPY);
					return;
				}
				dtde.rejectDrag();
			}
			@Override
			public void drop(DropTargetDropEvent dtde) {
				try {
					if (dtde.isDataFlavorSupported(DataFlavor.javaFileListFlavor)) {
						dtde.acceptDrop(DnDConstants.ACTION_COPY);
						Transferable transferable = dtde.getTransferable();
						@SuppressWarnings("unchecked")
						final List<Object> list = (List<Object>) transferable.getTransferData(DataFlavor.javaFileListFlavor);
						for(Object o : list){
							if(!(o instanceof File))continue;
							File f=(File)o;
							if(f.isDirectory())continue;
							process(f);
						}
						dtde.dropComplete(true);
					}
				}catch(UnsupportedFlavorException | IOException ex) {
						ex.printStackTrace();
				}
				dtde.rejectDrop();
			}
		};
		new DropTarget(label, DnDConstants.ACTION_COPY, dtl, true);
		db=new PhenologicalDB();
		try{
			db.connectDB("PhenologicalDB");
			map=createPointMap();
		}catch(Exception e){
			e.printStackTrace();
		}
	}

	private void process(final File f){
		try{
			parseCsv(f);
		}catch(Exception e){
			e.printStackTrace();
		}
	}

	private void exit() {
		int id=JOptionPane.showConfirmDialog(frame, "終了しますか?", "Info", JOptionPane.YES_NO_OPTION,JOptionPane.INFORMATION_MESSAGE);
		if(id==JOptionPane.YES_OPTION){
			frame.setVisible(false);
			System.exit(0);
		}
	}

	public void init(){
		frame.setSize(400,300);
		frame.setLocationRelativeTo(null);
		frame.setVisible(true);
	}

	private void parseCsv(File f)throws Exception{
		String name=JOptionPane.showInputDialog("種名");
		FileInputStream input = new FileInputStream(f);
		InputStreamReader stream = new InputStreamReader(input,"SJIS");
		BufferedReader br = new BufferedReader(stream);
		String line=null;
		List<String[]> lines=new ArrayList<String[]>();
		while((line=br.readLine())!=null){
			lines.add(parseLine(line));
		}
		br.close();
		createData(lines,name);
	}

	private boolean isDigit(String arg){
		char[] ch=arg.toCharArray();
		for(char c : ch){
			if(!Character.isDigit(c))return false;
		}
		return true;
	}

	private void createData(List<String[]> lines,String sp) throws Exception{
		List<PhenologicalData> list=new ArrayList<PhenologicalData>();
		String[] title=null;
		for(String[] line : lines){
			if(line[0].equals("番号")){
				title=line;
			}else{
				int pid=Integer.parseInt(line[0]);
				String pname=new String(line[1].getBytes(),"UTF-8");
				for(int i=2;i<title.length-1;i=i+2){
					String year=new String(title[i].getBytes(),"UTF-8");
					if(!isDigit(year))continue;
					String date=new String(line[i].getBytes(),"UTF-8");
					if(date.contains("-"))continue;
					String remark=new String(line[i+1].getBytes(),"UTF-8");
					try{
						PhenologicalData pd=createData(sp,pname,pid,year,date,remark);
						list.add(pd);
					}catch(Exception e){
						e.printStackTrace();
					}
				}
			}
		}
		db.addData(list);
	}

	private PhenologicalData createData(String sp,String name,int pointId,String year,String date,String remark)throws Exception{
		PhenologicalData ret=new PhenologicalData();
		ret.spaceies=sp;
		ret.pointName=name;
		ret.pointId=pointId;
		ret.year=Integer.parseInt(year);
		cal.set(Calendar.YEAR, ret.year);
		int[] dd=getMonthDay(date);
		cal.set(Calendar.MONTH, dd[0]);
		cal.set(Calendar.DATE, dd[1]);
		ret.date=cal.getTime();
		ret.remark=Integer.parseInt(remark);
		MPoint mp=map.get(ret.pointName);
		if(mp==null){
			System.out.println(ret.pointName);
		}
		ret.lat=mp.lat;
		ret.lng=mp.lng;
		return ret;
	}

	private int[] getMonthDay(String date){
		String mo,dy;
		if(date.length()==3){
			mo=date.substring(0, 1);
			dy=date.substring(1,3);
		}else{
			mo=date.substring(0, 2);
			dy=date.substring(2,4);
		}
		if(mo.length()==2&&mo.startsWith("0"))mo=mo.substring(1, 2);
		if(dy.startsWith("0"))dy=dy.substring(1,2);
		return new int[]{
			Integer.parseInt(mo)-1,
			Integer.parseInt(dy)};
	}


	private String[] parseLine(String line) {
		Matcher matcher = pattern.matcher(line);
		List<String> list = new ArrayList<String>();
		int index = 0;
		int com = 0;
		while (index < line.length()) {
			if (matcher.find(index + com)) {
				String s = matcher.group();
				index = matcher.end();
				list.add(s);
				com = 1;
			}
		}
		return ((String[]) list.toArray(new String[list.size()]));
	}

	private Map<String,MPoint> createPointMap() throws Exception{
		File f=new File("気象観測所.csv");
		FileInputStream input = new FileInputStream(f);
		InputStreamReader stream = new InputStreamReader(input,"SJIS");
		BufferedReader br = new BufferedReader(stream);
		String line=null;
		Map<String,MPoint> ret=new HashMap<String,MPoint>();
		br.readLine();
		while((line=br.readLine())!=null){
			String[] str=parseLine(line);
			MPoint p=new MPoint();
			p.name=str[3];
			p.lat=Double.parseDouble(str[6])+Double.parseDouble(str[7])/60;
			p.lng=Double.parseDouble(str[8])+Double.parseDouble(str[9])/60;
			ret.put(p.name, p);
		}
		br.close();
		return ret;
	}

	class MPoint{
		public String name;
		public double lat;
		public double lng;
	}

	public static void main(String[] args){
		PhenologicalDataCreater app=new PhenologicalDataCreater();
		app.init();
	}

}
