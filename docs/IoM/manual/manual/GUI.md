# IoM GUI(内测)

## 使用


GUI还未完全实现client的全部功能, 目前只实现了较为重要的功能. 并且在很多交互上还缺乏联动，存在bug等等问题。 请见谅

如果有任何用户体验, bug, 建议， 欢迎提供issue。 我们会尽快处理。

### 配置github action编译

IoM支持通过github action上准备好的编译环境自动化编译

fork https://github.com/chainreactors/malefic

[点击申请github token](https://github.com/settings/tokens/new) ， 需要有以下权限

![](/IoM/assets/Pasted%20image%2020250220142414.png)

在设置中搜索iom

![](/IoM/assets/Pasted%20image%2020250220142402.png)


这里的参数填写fork后的仓库所有者和仓库名， 以及刚刚申请的github token

连接任意服务器， 点击`Artifacts` 发现github变为绿点表示github action 自动编译已正确启用，点击Add Profile即可生成implant编译任务
![](/IoM/assets/Pasted%20image%2020250220142736.png)