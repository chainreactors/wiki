
mals是IoM的插件仓库, 可以通过lua/go为IoM编写插件脚本

并提供了官方索引仓库: https://github.com/chainreactors/mals 

### mal-community

mal-community 是一组通用插件的合集, 这些插件大多来自为Cobaltstrike实现的aggressive script , 通过将CNA移植到mal, 使其能运行在IoM生态上. 

repo: https://github.com/chainreactors/mal-community

mal-community分为多个细分用途的子目录, 可以独立安装

- community-lib ,工具库, 可以当作库被其他插件使用
	- [sharpblock](https://github.com/CCob/SharpBlock) 
	- [NET.BOF](https://github.com/CCob/BOF.NET) (TODO)
	- [No-Consolation](https://github.com/fortra/No-Consolation)
- community-common, 常用工具包
	- [OperatorsKit](https://github.com/REDMED-X/OperatorsKit)
	- [CS-Remote-OPs-BOF](https://github.com/trustedsec/CS-Remote-OPs-BOF)
	- [CS-Situational-Awareness-BOF](https://github.com/trustedsec/CS-Situational-Awareness-BOF)
	- chainreactor工具
		- [gogo](https://github.com/chainreactors/gogo)
		- [zombie](https://github.com/chainreactors/zombie)
	- misc 未分类的常用工具集合
- community-elevate 提权工具包
	- [ElevateKit](https://github.com/rsmudge/ElevateKit)
	- [UAC-BOF-Bonanza](https://github.com/icyguider/UAC-BOF-Bonanza)
- community-proxy 代理工具包
	- gost
- community-move 横向移动工具包
- community-persistence 权限维持工具包
- community-domain 域渗透工具包

## mal api
mal 是一个支持多语言的插件系统, 但目前只有lua达到基本可用阶段, 因此仅提供基于lua语言实现的文档.


