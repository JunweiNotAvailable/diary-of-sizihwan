export const Colors = {
  primary: '#331177',
  secondary: '#eee9ff',
  primaryGray: '#88808f',
  primaryLightGray: '#e6e4e8',
  secondaryGray: '#f7f6f8',
  like: '#ff4466',
}

export const Map = {
  defaultLocation: {
    latitude: 22.6273,
    longitude: 120.2657,
    latitudeDelta: 0.0042,
    longitudeDelta: 0.0042,
  }
}

export const Locations = {
  nsysu: [
    { id: "il", icon: 'library', name: "圖資大樓(圖IL)", name_en: "Library and Information Building(圖IL)", coordinates: {"latitude": 22.627341580807375, "longitude": 120.26586145162584} },
    { id: "dorm-wuling", icon: 'bed', name: "學生宿舍-武嶺", name_en: "Dormitory - Wu-ling Villa", coordinates: {"latitude": 22.630826465076076, "longitude": 120.2637565881014} },
    { id: "dorm-tsuiheng", icon: 'bed', name: "學生宿舍-翠亨", name_en: "Dormitory - Tsui-heng Villa", coordinates: {"latitude": 22.628534268487233, "longitude": 120.26864457875492} },
    { id: "dorm-hl", icon: 'bed', name: "學生宿舍-H/L棟", name_en: "Dormitory - Building (H&L)", coordinates: {"latitude": 22.627821256650268, "longitude": 120.26838574558498} },
    { id: 're-e', icon: 'fork', name: "第E餐廳", name_en: "E Restaurant", coordinates: {"latitude": 22.628362514671952, "longitude": 120.26836093515158} },
    { id: 're-sh', icon: 'fork', name: "山海樓", name_en: "Shanghai Restaurant", coordinates: {"latitude": 22.62843926234928, "longitude": 120.26472352445126} },
    { id: 're-milo', icon: 'fork', name: "米羅餐廳", name_en: "Milo Restaurant", coordinates: {"latitude": 22.63022827570103, "longitude": 120.26376463472845} },
    { id: "std-center", icon: 'users', name: "學生活動中心", name_en: "Student Center", coordinates: {"latitude": 22.628271840949587, "longitude": 120.2650474011898} },
    { id: "ss-cm", icon: 'briefcase', name: "社會管理學院(管CM, 社SS)", name_en: "College of Social Sciences(社SS), College of Management(管CM)", coordinates: {"latitude": 22.626688600034235, "longitude": 120.2653843536973} },
    { id: "ec", icon: 'cpu', name: "電資大樓(工EC)", name_en: "Building of Electrical Engineering(工EC)", coordinates: {"latitude": 22.627208818617053, "longitude": 120.2675210684538} },
    { id: "ev", icon: 'leaf', name: "環工大樓(工EV)", name_en: "Building of Environmental Engineering(工EV)", coordinates: {"latitude": 22.627500957160226, "longitude": 120.26704631745817} },
    { id: "ms", icon: 'layers', name: "材料大樓(工MS)", name_en: "Building of Materials(工MS)", coordinates: {"latitude": 22.626955672640037, "longitude": 120.26704732328653} },
    { id: "ch-ph-bi", icon: 'flask', name: "化學, 物理, 生科館(理CH, PH, BI)", name_en: "Building of Chemistry(理CH), Physics(理PH), Biological Sciences(理BI)", coordinates: {"latitude": 22.62636551266578, "longitude": 120.26695378124714} },
    { id: "sc-en", icon: 'atom', name: "理工學院(理SC, 工EN)", name_en: "College of Sciences(理SC), College of Engineering(工EN)", coordinates: {"latitude": 22.62676256341502, "longitude": 120.26641398668288} },
    { id: "mb", icon: 'fish', name: "海資館(海MB)", name_en: "Marine Resources Building(海MB)", coordinates: {"latitude": 22.63084936518665, "longitude": 120.26230685412884} },
    { id: "me", icon: 'waves', name: "海工館(海ME)", name_en: "Building of Marine Environment and Engineering(海ME)", coordinates: {"latitude": 22.629160007598937, "longitude": 120.26272192597389} },
    { id: "la", icon: 'book', name: "文學院(文LA)", name_en: "College of Liberal Arts(文LA)", coordinates: {"latitude": 22.634540875014988, "longitude": 120.26109617203474} },
    { id: "fa", icon: 'palette', name: "藝術大樓(文FA)", name_en: "Fine Art Building(文FA)", coordinates: {"latitude": 22.634389862055816, "longitude": 120.26216872036456} },
    { id: "admin", icon: 'admin', name: "行政大樓(行AD)", name_en: "Administration Building(行AD)", coordinates: {"latitude": 22.625850551918763, "longitude": 120.26585809886454} },
    { id: "square", icon: 'tree', name: "中庭廣場", name_en: "Central Square", coordinates: {"latitude": 22.626635061662643, "longitude": 120.26588324457408} },
    { id: "gm", icon: 'dumbbell', name: "體育館(體GM)", name_en: "Gymnasium(體GM)", coordinates: {"latitude": 22.624776060302267, "longitude": 120.26631474494934} },
    { id: "syshall", icon: 'landmark', name: "逸仙館", name_en: "Sun Yat-sen Hall", coordinates: {"latitude": 22.62478998665862, "longitude": 120.26535015553236} },
    { id: "ir", icon: 'globe', name: "國際研究大樓(國IR)", name_en: "Building of International Research(國IR)", coordinates: {"latitude": 22.623816066737394, "longitude": 120.26607602834702} },
    { id: "sw-sports", icon: 'sailboat', name: "西子灘海域中心", name_en: "Sizihwan Marine Sports Center", coordinates: {"latitude": 22.62723079092313, "longitude": 120.26391517370939} },
    { id: "beach-resort", icon: 'umbrella', name: "西子灘沙灘會館", name_en: "Sunset Beach Resort", coordinates: {"latitude": 22.624844144697683, "longitude": 120.26457365602255} },
    { id: "field", icon: 'flag', name: "運動場", name_en: "Athletic Field", coordinates: {"latitude": 22.623306048087187, "longitude": 120.26456627994776} },
  ]
}

export const Categories = [
  { name: 'general', color: '#778899' },
  { name: 'food', color: '#ee4466' },
  { name: 'academics', color: '#9944bb' },
  { name: 'facilities', color: '#772233' },
  { name: 'events', color: '#ff6644' },
  { name: 'casual', color: '#55aacc' },
]
