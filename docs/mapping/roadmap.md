
原有的ASM基于外网自动化渗透的思路实现。 因此infra层，基于云函数实现。并且工作流引擎的调度器设计存在不少缺陷，不够工程化， 应用场景过于单一， 使用复杂的问题。


## stage 1
### 重构架构

整体架构进行了微调。 分为: 

- 基础设施层
- 分布式调度层
- 数据层


#### 基础设施层

基础设施即 worker 。 原本的worker只在云函数与本地工作， 后续worker将基于不同的工作场景实现。

worker代表着这套系统的能力边界。**technology 和pattern将在这个层面上实现。 对应代码中的task与flow。**

但是task和flow还不是真正最底层的能力提供者。 只是能力的使用者， 以gogo为例

```python
@task(name="gogo_cidr")  
def gogo_cidr(cidr) -> Result[GOGOData]:  
    cmd = f"-i {cidr} -p top2,win,db -Ojl -f gogo_vir_result.json".split(" ")  
    stdout, data = get_engine().gogo.run(cmd, save=False)  
    return data  
  
  
@task(name="gogo_iplist")  
async def gogo_iplist(iplist) -> Result[GOGOData]:  
    cmd = f"-p top2,win,db -v -Ojl -f gogo_vir_result.json".split(" ")  
    stdout, data = get_engine().gogo.run(cmd, body={"-l": "\n".join(iplist).encode("utf-8")}, save=False)  
    return data  
  
  
@artifact_flow(name="gogo")  
async def gogo_flow(meta) -> Result[GOGOData]:  
    match meta.task_name:  
        case "gogo_iplist":  
            gogo_result = await gogo_iplist(meta.iplist)  
        case _:  
            gogo_result = await gogo_cidr(meta.cidr)  
    return gogo_result
```


**真正的底层能力基于engine实现**。 我们将提供一个worker工厂， 基于现有的配置组装能力。 

现在的实现是固定实现， 还不是工厂模式， 后续将改成工厂模式, worker 将根据不同的配置组装。

*在命名上 engine可能需要修改为Capability*

```python
class Engine:  
    config: EngineSettings  
    serverless_engine: ServerlessEngine  
    ina_engine: InaEngine  
    company_engine: CompanyEngine  
    local_engine: LocalEngine
```

为了保持抽象的统一性， 我们需要将已有数据源获取数据也封装为Capability 通过消息队列获取和推送。 而不是在调度层直接获取数据， 保证每个Capability的原子性。


**Capability 代表能力边界**。如果是外部的自动化测绘的场景， 目前的能力已经足够覆盖绝大多数场景。 如果要成为CTEM， 那还不够， 我们还需要拓展大模型，移动端， IoT等场景的能力。 

**每个Capability将有一组能力**，代表各个细分领域， **Ability 表示元能力**， 是能力的最小单位。 

**task是对Ability的自动封装， 每个Ability都会有至少一个task。 flow是对多个task的编排。可以基于yaml进行编排。** 


在下面的这个例子中， 我们需要处理非常复杂的数据格式。 

```yaml
name: "subfinder_dnsx_httpx_pipeline"  
description: "完整的子域名发现到Web探测的Pipeline"  
  
steps:  
  - name: "subdomain_discovery"  
    artifact: "subfinder"  
    operation: "baseline"  
    input: "${{ vars.input }}"  
    outputs:  
      # 提取所有有效域名，去重 - 供下一步使用  
      domains: "${{ unique([item.host for item in result if item.host]) }}"  
  
  - name: "dns_resolution"  
    artifact: "dnsx"  
    operation: "baseline"  
    input: "${{ vars.domains }}"  
    outputs:  
      # 提取所有解析成功的IP地址，需要展平处理  
      resolved_ips: "${{ jq(result, 'map(select(.a and (.a | length) > 0)) | map(.a) | flatten | unique') }}"  
      # 解析成功的域名列表 - 供下一步使用  
      live_domains: "${{ [item.host for item in result if item.a and length(item.a) > 0] }}"  
    condition: "${{ length(vars.domains) > 0 }}"  
  
  - name: "web_discovery"  
    artifact: "httpx"  
    operation: "baseline"  
    input:  
      - "${{ vars.live_domains }}"  
      - ${{vars.resolved_ips}}  
    condition: "${{ length(vars.live_domains) > 0 }}"
```

难点/疑点

- Capability 需要继承原有BAS的能力， 这是一个较为漫长的过程。 但只要保持良好的抽象， AI可以实现大部分工作
- 业务的同学实现最小化poc， 就会在系统中自动注册，task。 
- 如果是有效性验证， 对数据的要求并不高， 很多情况下只需要 true/false即可表述。只需要在对应的Capability,  那只需要实现元能力的最小poc。 然后通过web ui编排yaml即可实现可视化编排。 


#### 分布式调度层

每个worker启动时都会注册收发数据的消息队列。并且告知调度器自身的能力边界以及性能。

通过调度器的api发起扫描任务时，会根据任务类型 选择合适的worker， 如果有多个同类型worker， **会将任务拆分给多个worker同时进行， 调度器进行调度的最小任务单位是flow**。

调度器还将负责数据的清洗、分类、入库、关联等操作。为数据层提供初步分析后的数据。 

**剧本编排将在这个层级实现**， 一个剧本中， **执行大量的technology（task）与pattern（flow）**， 需要在分布式调度器中管理这个任务， 并将其交给合适的worker执行。 例如跨安全域的任务， 可能需要从worker A接收数据， 交给worker B执行。

或者多个worker来提高执行任务的效率， 例如外网探测任务中，可能每个worker的并发性能都在10000左右， 需要多个worker来提高效率。 

后续的AI相关的能力也将在这一层实现。 

**所有的task都将自动注册为MCP中的tools。 然后实现一个AI基于MCP调用不用的tools完成自动化紫军演练。**


#### 数据层


数据层分为

- 缓存 redis ， 防止多次同个task多次执行重复工作。
- 数仓 postgre/ods，保存每个task的原始数据。 
	- workflow 调度数据
	- 每个task的原始数据
	- 基于第三方数据的筛选后元数据
	- 图数据库中的node与relaship的映射数据
- 图数据库 将数据进行关联， 主要提供给攻击面引擎， BAS可能只需要收集结果。 



### 需要从原本的BAS中继承的能力

- RPA相关， RPA可以作为一个特殊的worker
- 各种内部数据接口
- 原本的元能力， 原本基于airflow实现
- ...