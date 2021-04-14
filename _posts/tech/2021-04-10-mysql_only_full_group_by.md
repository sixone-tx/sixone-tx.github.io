---
layout: post
title: Mysql ONLY_FULL_GROUP_BY
description: \[42000][1055] Expression SELECT list is not in GROUP BY clause and contains nonaggregated column 'shmonitor.c_view.view_id' which is not functionally dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by
img: post-3.jpg # Add image post (optional)
tags: [mysql]
author: sixone
tech: true
---

MySql在低版本（5.7.x以下）中允许select后面的非聚合列不出现在group by中。以下sql在低版本中是可以运行的，但是在5.7及以上版本会报错

SQL

```sql
select view_id,parent_view,count(*) from c_view group by parent_view;
```

报错

```
[42000][1055] Expression #1 of SELECT list is not in GROUP BY clause and contains nonaggregated column 'shmonitor.c_view.view_id' which is not functionally dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by
```



## 解决方法

可以通过三种方式解决报错问题

1. 修改sql使其遵守only_full_group_by规则

    ```sql
    -- 1 去掉不在group by 中的非聚合列
    select parent_view,count(*) from c_view group by parent_view;
    -- 2 使用any_value
    -- any_value()会选择被分到同一组的数据里第一条数据的指定列值作为返回数据
    select any_value(view_id),parent_view,count(*) from c_view group by parent_view;
    ```

2. 将MySql的版本降到5.7以下

3. 关闭only_full_group_by规则

    查询当前状态

    ```sql
    select @@sql_mode;
	ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
    ```

    修改my.cnf

    ```bash
    [mysqld]
    sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
    ```
