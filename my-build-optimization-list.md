# 构建优化
原始shop 6s
total 7.271
## swc-loader编译shop

<!-- 
原始
    全局npm start: 
    整体耗时：webpack 5.104.1 compiled successfully in 1817 ms

    shop耗时：
    ```
        Entrypoints:
    shop (1.83 MiB)
        assets/shop-vendors.0699e8d3ac3b52d3a773.js
        assets/shop.d099f7267299083390c8.js

    webpack 5.104.1 compiled with 2 warnings in 1657 ms
    ```
shop 使用swc-loader替换babel-loader 
    整体耗时：webpack 5.104.1 compiled successfully in 1475 ms
    
    shop耗时：
    ```
    Entrypoints:
    shop (1.58 MiB)
        assets/shop-vendors.64d64529bf5350a41d53.js
        assets/shop.d6d27ad06bf7ce994467.js

    webpack 5.104.1 compiled with 2 warnings in 876 ms
    ```

## webpack5持久化缓存
```
Entrypoints:
  shop (1.58 MiB)
      assets/shop-vendors.64d64529bf5350a41d53.js
      assets/shop.a1746b68dffd5b5afb12.js
      shop.c723c07fc0920b6e5cb1.hot-update.js

webpack 5.104.1 compiled with 2 warnings in 20 ms
``` -->