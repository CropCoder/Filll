/**
 * CDRT 团队成员数据与配置文件
 * 作者: Jiwen Zhao (https://github.com/CropCoder)
 *
 * 说明: 本文件集中管理团队网站的所有数据和配置信息
 * 修改成员信息、添加/删除成员、调整分类颜色等操作均在此文件中完成
 */

var DATA = {
  scientists: [
    {
      name: "马忠华",
      title: "教授",
      email: "zhma@zju.edu.cn",
      category: "高级科学家",
      appointmentType: "双聘",
      photo: "./img/mazh.png",
      bio: "国家自然科学基金杰青获得者，入选中组部\"万人计划\"中青年科技领军人才、全国农业科研杰出人才、Elsevier中国高被引学者、国家小麦产业技术体系岗位专家。长期从事植物镰刀菌病害发生规律、毒素合成调控及绿色防控研究。主持国家重点研发项目、自然科学基金重点项目等课题，在Nat Commun、Nucleic Acids Res等知名期刊上发表论文100余篇，以主要完成人获国家科技进步二等奖2项。担任《Phytopathology Research》、《Pesticide Biochemistry and Physiology》等期刊副主编/编委。",
      publicationLink: "https://scholar.google.com.hk/citations?hl=zh-CN&user=prsiGwsAAAAJ"
    },
    {
      name: "王晓杰",
      title: "教授",
      email: "wangxiaojie@nwsuaf.edu.cn",
      category: "高级科学家",
      appointmentType: "双聘",
      photo: "./img/wangxiaojie.jpg",
      bio: "享受国务院特殊津贴，“国家杰出青年基金”获得者，“国家小麦产业技术体系”锈病防控岗位科学家，获国家优秀青年基金、全国百篇优秀博士论文、中国青年科技奖、杨凌示范区五一劳动奖章，入选“万人计划”领军人才、教育部“青年长江学者”、“万人计划”青年拔尖人才、陕西青年科技标兵等。西北农林科技大学二级教授，博士生导师，作物抗逆与高效生产全国重点实验室主任。长期从事小麦条锈病灾变机制、病害可持续防控理论与新技术研发等研究。在Cell、PNAS、The Plant Cell等发表论文80余篇，获国家发明专利33件。",
      publicationLink: "https://www.researchgate.net/profile/Xiaojie-Wang-34"
    },
    {
      name: "袁猛",
      title: "教授",
      email: "yuanmeng@yzwlab.cn",
      category: "主任科学家",
      appointmentType: "单聘",
      photo: "./img/yuanmeng.jpg",
      bio: "国家自然科学基金优青和湖北省自然科学基金杰青获得者，国家自然科学基金创新群体\"绿色超级稻生物学\"骨干，科技创新2030-农业生物育种重大项目课题负责人。在水稻重要抗病基因发掘和功能机制解析及抗病育种应用中取得了进展，相关成果发表在Nature、Plant Cell、Mol Plant等主流期刊。荣获2018年湖北省第一届青年遗传学家奖、2023年教育部科学技术进步一等奖。",
      publicationLink: "https://scholar.google.com/citations?hl=zh-CN&user=w-Jx9DEAAAAJ"
    },
    {
      name: "樊晶",
      title: "教授",
      email: "fanjing@yzwlab.cn",
      category: "主任科学家",
      appointmentType: "单聘",
      photo: "./img/fanjing.jpg",
      bio: "国家级人才获得者。主要从事稻曲病的致害机理和水稻抗病遗传研究，在国际上率先发现稻曲病菌定殖水稻雄蕊和激活灌浆的特殊致病策略。主持国家自然科学基金项目4项和四川省青年科技创新研究团队等省部级以上项目4项。相关成果发表在Nat Plants、Mol Plant、Annual Rev Phytopathol等主流期刊，参编英文专著1部，培育水稻新品种4个，授权国家发明专利3件，获省科技进步一等奖1项。",
      publicationLink: "https://orcid.org/0000-0002-6747-4302"
    },
    {
      name: "韩管助",
      title: "教授",
      email: "guanzhu@njnu.edu.cn",
      category: "主任科学家",
      appointmentType: "双聘",
      photo: "./img/hanguanzhu.png",
      bio: "南京师范大学生命科学学院教授，国家级人才获得者。主要从事病毒进化和多样性以及病原与宿主间互作进化方面的研究工作，共发表SCI收录论文70余篇，其中作为通讯作者在PNAS、Nat Commun、Mol Biol and Evol、Plant Cell、PLOS Pathog、mBio等期刊发表论文50余篇。研究工作多次获得Nat Rev Microbiol、Trends Plant Sci、The Plant Cell等期刊评述或推荐。多次受邀为Nat Plants、Trends Microbiol、New Phytol等期刊撰写综述或评述文章。",
      publicationLink: "https://scholar.google.com/citations?hl=en&user=bksTFI0AAAAJ"
    },
    {
      name: "王伟",
      title: "教授",
      email: "wangwei_bnu@bnu.edu.cn",
      category: "主任科学家",
      appointmentType: "双聘",
      photo: "./img/wangwei.jpg",
      bio: "国家级人才获得者。长期从事植物与微生物互作，在植物抗性代谢物的作用机制、农作物重要病害抗病基因挖掘及作用机制解析等方向取得重要研究成果。先后主持国家自然科学基金项目2项、国家重点研发项目子课题2项及中国科学院先导项目子课题1项。以通讯或第一作者（含共同）在Cell、Science、Cell Host Microbe、Molecular Cell、Plant Cell、J Integr Plant Biol等期刊发表论文6篇，申请国家发明专利7项，获得授权1项。",
      publicationLink: "https://orcid.org/0000-0003-3030-6177"
    },
    {
      name: "王磊",
      title: "博士",
      email: "wanglei@yzwlab.cn",
      category: "主任科学家",
      appointmentType: "单聘",
      photo: "./img/wanglei.jpg",
      bio: "国家级青年人才，Current Biology期刊顾问委员会成员，曾获欧盟玛丽居里学者荣誉。主要从事作物抗虫免疫理论研究，在作物免疫机制研究上取得系列重要进展，以第一作者或通讯作者在Cell、Nature Plants、Current Biology等国际期刊发表文章多篇。",
      publicationLink: "https://orcid.org/0000-0002-6332-6476"
    },
    {
      name: "董晓静",
      title: "博士",
      email: "dongxiaojing@yzwlab.cn",
      category: "青年科学家",
      appointmentType: "单聘",
      photo: "./img/dongxiaojing.jpg",
      bio: "2020年6月获得中国农业大学农学博士学位。主要从事植物与微生物互作方向，系统性地对植物免疫发生机制进行研究，在植物免疫信号通路机制解析等方向取得重要研究成果。先后主持国家自然科学基金项目1项、国家核心技术攻关工程子课题1项及中国博士后科学基金面上项目1项。以通讯或第一作者（含共同）在Plant Cell和EMBO J学术期刊发表论文2篇。",
      publicationLink: "https://orcid.org/0000-0002-9807-0044"
    },
    {
      name: "马省伟",
      title: "博士",
      email: "mashengwei@yzwlab.cn",
      category: "青年科学家",
      appointmentType: "单聘",
      photo: "./img/mashengwei.jpg",
      bio: "2020年博士毕业于南京农业大学生物信息学专业。研究方向为基于组学和人工智能算法挖掘作物抗病基因和病原物无毒基因。主持国家自然科学基金等研究课题2项，以第一作者（含共同）在Nat Genet、Nat Commun、Mol Plant、Plant Cell等主流期刊发表文章多篇。创办小麦多组学WheatOmics平台，累计访问次数已达150万次，成为国内外小麦功能基因组研究的重要工具；创办\"小麦研究联盟\"微信公众号，已发展成为国内小麦研究领域的主流互动平台，同时发起Wheat Omics青年学术研讨会，促进了小麦青年同行之间的交流。参与筹办WheatOmics期刊，并任编委。",
      publicationLink: "https://scholar.google.com/citations?hl=zh-CN&user=a9zeI9YAAAAJ"
    },
    {
      name: "王宏泽",
      title: "博士",
      email: "wanghongze@yzwlab.cn",
      category: "青年科学家",
      appointmentType: "单聘",
      photo: "./img/wanghongze.jpg",
      bio: "主要从事作物与病原微生物互作机制研究，在作物功能基因和植物免疫机制等方向取得了重要进展。相关成果发表在Mol Plant和Nat Commun等主流学术期刊，参与多个国家自然科学基金项目，拥有多个应用于生产方向的抗病基因国际专利。",
      publicationLink: "https://orcid.org/0009-0002-2521-0955"
    },
    {
      name: "马智明",
      title: "博士",
      email: "mazhiming@yzwlab.cn",
      category: "青年科学家",
      appointmentType: "单聘",
      photo: "./img/mazhiming.jpg",
      bio: "2021年毕业于新加坡南洋理工大学获理学博士学位。主要致力于通过细胞生物学超微定量成像，遗传学，生物化学, 体外重建等多种方法解析细胞膜上多种信号分子凝聚体的动态组装，并探究其对植物免疫或发育信号转导的精细调控及相关机理。研究成果以第一作者或共同第一作者在The Plant Cell，The EMBO journal，PNAS，Cell Reports，Plant Physiology，New Phytologist等国际主流期刊发表论文10篇。",
      publicationLink: "https://orcid.org/0000-0002-8610-4876"
    },
    {
      name: "江聪",
      title: "教授",
      email: "cjiang@nwafu.edu.cn",
      category: "主任科学家",
      appointmentType: "双聘",
      photo: "./img/jiangcong.jpg",
      bio: "入选国家高层次人才特殊支持计划青年拔尖人才、农业农村部神农青年英才、陕西省杰青等。担任多个期刊编委/青年编委，陕西省植物保护学会理事等。以小麦赤霉病致病菌禾谷镰孢为切入点，致力于解析禾谷镰孢产毒和致病机制，努力为破解赤霉病防控难题提供新的解决方案。相关成果以第一或通讯作者在Cell Host & Microbe、Nature Microbiology、PNAS、Nature Communications（3篇）、Molecular Plant、New Phytologist、PLoS Pathogens等权威期刊发表论文30余篇",    }
  ]
};

// 成员分类颜色配置，按需增删分类
var catColors = {
  "高级科学家": { dot: "bg-amber-500", badge: "bg-amber-50 border-amber-200 text-amber-700" },
  "主任科学家": { dot: "bg-sky-500", badge: "bg-sky-50 border-sky-200 text-sky-700" },
  "青年科学家": { dot: "bg-purple-500", badge: "bg-purple-50 border-purple-200 text-purple-700" },
  "兼职科学家": { dot: "bg-purple-500", badge: "bg-purple-50 border-purple-200 text-purple-700" }
};

// 分类排序顺序，控制成员列表中的显示顺序
var categoryOrder = ["高级科学家", "主任科学家", "青年科学家","兼职科学家"];
