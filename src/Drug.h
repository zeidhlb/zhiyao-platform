#ifndef DRUG_H
#define DRUG_H

#include <string>

struct Drug {
    std::string id;
    std::string name;

    // 为了在 std::set 或 std::map 中使用，需要定义一个比较操作符
    bool operator<(const Drug& other) const {
        return id < other.id;
    }
};

#endif // DRUG_H
