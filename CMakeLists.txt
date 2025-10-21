cmake_minimum_required(VERSION 3.10)
project(ZhiYao)

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 添加头文件目录
include_directories(src)

# 查找 nlohmann_json 库
# 请确保将 nlohmann/json.hpp 放在一个 include 路径下，或者使用 find_package
# 为了简单起见，我们假设 json.hpp 在 'third_party/nlohmann' 目录下
# 你需要手动创建这个目录并下载 json.hpp 文件
include_directories(third_party)

# 添加源文件
add_executable(zhiyao_cli src/main.cpp)

# 如果你的源文件分成了多个 .cpp 文件，像这样添加它们:
# add_executable(zhiyao_cli src/main.cpp src/User.cpp src/KnowledgeBase.cpp)

# 打印消息提示用户下载 json 库
message(STATUS "请确保已将 nlohmann/json.hpp 下载到 'third_party/nlohmann' 目录下。")
message(STATUS "下载地址: https://github.com/nlohmann/json/releases/latest")
