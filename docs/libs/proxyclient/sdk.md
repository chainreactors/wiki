

本文档详细说明了 ProxyClient 库的所有公开接口及其使用方法。  
  
## 基础接口  
  
### NewClient  
  
创建一个新的代理客户端。  
  
```go  
func NewClient(proxy *url.URL) (Dial, error)  
```  
  
参数：  
  
- proxy: 代理服务器的 URL  
示例：  
  
```go  
proxy, _ := url.Parse("http://localhost:8080")  
dial, err := proxyclient.NewClient(proxy)  
if err != nil {  
    panic(err)
}  
```  
  
### NewClientWithDial  
  
使用自定义上游连接器创建代理客户端。  
  
```go  
func NewClientWithDial(proxy *url.URL, upstreamDial Dial) (Dial, error)  
```  
  
参数：  
  
- proxy: 代理服务器的 URL- upstreamDial: 上游连接器  
  
示例：  
  
```go  
proxy, _ := url.Parse("http://localhost:8080")  
customDial := func(ctx context.Context, network, address string) (net.Conn, error) {  
    dialer := net.Dialer{Timeout: 5 * time.Second}    
    return dialer.DialContext(ctx, network, address)
}  
dial, err := proxyclient.NewClientWithDial(proxy, customDial)  
```  
  
### NewClientChain  
  
创建代理链。  
  
```go  
func NewClientChain(proxies []*url.URL) (Dial, error)  
```  
  
参数：  
  
- proxies: 代理服务器 URL 列表  
  
示例：  
  
```go  
proxy1, _ := url.Parse("socks5://localhost:1080")  
proxy2, _ := url.Parse("http://localhost:8080")  
dial, err := proxyclient.NewClientChain([]*url.URL{proxy1, proxy2})  
```  
  
### NewClientChainWithDial  
  
使用自定义上游连接器创建代理链。  
  
```go  
func NewClientChainWithDial(proxies []*url.URL, upstreamDial Dial) (Dial, error)  
```  
  
参数：  
  
- proxies: 代理服务器 URL 列表  
- upstreamDial: 上游连接器  
  
示例：  
  
```go  
proxy1, _ := url.Parse("socks5://localhost:1080")  
proxy2, _ := url.Parse("http://localhost:8080")  
customDial := func(ctx context.Context, network, address string) (net.Conn, error) {  
    return net.Dial(network, address)
}  
dial, err := proxyclient.NewClientChainWithDial([]*url.URL{proxy1, proxy2}, customDial)  
```  
  
### RegisterScheme  
  
注册新的代理协议。  
  
```go  
func RegisterScheme(schemeName string, factory DialFactory)  
```  
  
参数：  
  
- schemeName: 协议名称  
- factory: 协议工厂函数  
  
示例：  
  
```go  
proxyclient.RegisterScheme("MYPROXY", func(proxy *url.URL, upstreamDial Dial) (Dial, error) {  
    // 实现自定义代理协议  
    return func(ctx context.Context, network, address string) (net.Conn, error) {        // 实现连接逻辑  
        return nil, nil    
}, nil})  
```  
  
### SupportedSchemes  
  
获取所有支持的代理协议。  
  
```go  
func SupportedSchemes() []string  
```  
  
示例：  
  
```go  
schemes := proxyclient.SupportedSchemes()  
fmt.Println("Supported protocols:", schemes)  
```  
  
## 工具函数  
  
### ParseProxyURLs  
  
解析多个代理 URL 字符串。  
  
```go  
func ParseProxyURLs(proxyURL []string) ([]*url.URL, error)  
```  
  
参数：  
  
- proxyURL: 代理 URL 字符串列表  
  
示例：  
  
```go  
urls := []string{  
    "http://localhost:8080",   
    "socks5://localhost:1080",
}  
proxies, err := proxyclient.ParseProxyURLs(urls)  
```  
  
### DialWithTimeout  
  
创建带超时的连接器。  
  
```go  
func DialWithTimeout(timeout time.Duration) Dial  
```  
  
参数：  
  
- timeout: 连接超时时间  
  
示例：  
  
```go  
dial := proxyclient.DialWithTimeout(5 * time.Second)  
conn, err := dial(context.Background(), "tcp", "example.com:80")  
```  
  